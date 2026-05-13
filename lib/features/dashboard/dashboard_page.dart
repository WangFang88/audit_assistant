import 'dart:async';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';
import '../../shared/widgets/section_card.dart';
import '../payment/payment_page.dart';

Map<String, String> _parseCaseChunk(String chunk) {
  final lines = chunk.split('\n').where((l) => l.trim().isNotEmpty).toList();
  if (lines.isEmpty) return {};

  final lastLine = lines.last;
  final fields = lastLine.split(',');

  String getField(int index) => (index >= 0 && index < fields.length) ? fields[index].trim() : '';

  return {
    'category': getField(fields.length - 5),
    'subcategory': getField(fields.length - 4),
    'problemType': getField(fields.length - 3),
    'description': getField(fields.length - 2),
    'basis': getField(fields.length - 1),
  };
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({
    super.key,
    required this.apiService,
    required this.currentUser,
    required this.onLogout,
  });

  final ApiService apiService;
  final AppUser currentUser;
  final VoidCallback onLogout;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final TextEditingController _questionController = TextEditingController(
    text: '请检索与专项资金使用和采购审批相关的制度依据。',
  );
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _messageSearchController = TextEditingController();
  final TextEditingController _conversationSearchController = TextEditingController();
  final ScrollController _messagesScrollController = ScrollController();
  static const _pinnedConversationIdsKey = 'chat.pinnedConversationIds';
  static const _mutedConversationIdsKey = 'chat.mutedConversationIds';

  int _selectedIndex = 0;
  bool _loading = true;
  bool _switchingGroup = false;
  bool _searching = false;
  bool _chatLoading = false;
  bool _sendingMessage = false;
  bool _membersLoading = false;
  bool _documentsLoading = false;
  bool _subscribing = false;
  String? _error;
  String? _queryScope;
  DashboardOverview? _overview;
  List<Map<String, dynamic>> _queryHistory = [];
  QueryResult? _result;
  List<ConversationSummary> _conversations = const [];
  List<ChatMessage> _messages = const [];
  List<GroupMember> _members = const [];
  List<KnowledgeDocument> _documents = const [];
  List<ExtractionJob> _extractJobs = const [];
  List<PlatformFile> _selectedMessageFiles = const [];
  List<_PendingChatMessage> _pendingMessages = const [];
  Set<String> _pinnedConversationIds = <String>{};
  Set<String> _mutedConversationIds = <String>{};
  String? _selectedConversationId;
  String? _selectedGroupId;
  Timer? _chatPollingTimer;

  @override
  void initState() {
    super.initState();
    _restorePinnedConversations();
    _restoreMutedConversations();
    _loadDashboard();
    _startChatPolling();
  }

  void _startChatPolling() {
    _chatPollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted) return;
      _pollChat();
    });
  }

  Future<void> _pollChat() async {
    try {
      final groupId = _activeGroupId;
      final conversations = widget.currentUser.role == 'admin'
          ? const <ConversationSummary>[]
          : await widget.apiService.fetchConversations(groupId: groupId);
      if (!mounted) return;
      setState(() {
        _conversations = conversations;
      });
      final selectedId = _selectedConversationId;
      if (selectedId != null && _selectedIndex == 1) {
        final messages = await widget.apiService.fetchMessages(selectedId);
        if (!mounted) return;
        final lastKnownId = _messages.isNotEmpty ? _messages.last.id : null;
        final hasNew = messages.isNotEmpty && messages.last.id != lastKnownId;
        setState(() {
          _messages = messages;
        });
        if (hasNew) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_messagesScrollController.hasClients) {
              _messagesScrollController.animateTo(
                _messagesScrollController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
              );
            }
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _chatPollingTimer?.cancel();
    _questionController.dispose();
    _messageController.dispose();
    _messageSearchController.dispose();
    _conversationSearchController.dispose();
    _messagesScrollController.dispose();
    super.dispose();
  }

  String? get _activeGroupId => _selectedGroupId;

  String _formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    }
    if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(bytes < 10 * 1024 ? 1 : 0)} KB';
    }
    return '${(bytes / (1024 * 1024)).toStringAsFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB';
  }

  List<ConversationSummary> get _sortedConversations {
    final items = [..._conversations];
    items.sort((a, b) {
      final aPinned = _pinnedConversationIds.contains(a.id);
      final bPinned = _pinnedConversationIds.contains(b.id);
      if (aPinned != bPinned) {
        return aPinned ? -1 : 1;
      }
      final aMuted = _mutedConversationIds.contains(a.id);
      final bMuted = _mutedConversationIds.contains(b.id);
      if (aMuted != bMuted) {
        return aMuted ? 1 : -1;
      }
      if (a.unreadCount != b.unreadCount) {
        return b.unreadCount.compareTo(a.unreadCount);
      }
      if (a.isTeamAgent != b.isTeamAgent) {
        return a.isTeamAgent ? -1 : 1;
      }
      return b.lastMessageAt.compareTo(a.lastMessageAt);
    });
    return items;
  }

  List<ConversationSummary> get _visibleConversations {
    final keyword = _conversationSearchController.text.trim().toLowerCase();
    final source = _sortedConversations;
    if (keyword.isEmpty) {
      return source;
    }
    return source.where((conversation) {
      return conversation.title.toLowerCase().contains(keyword) ||
          conversation.lastMessage.toLowerCase().contains(keyword);
    }).toList();
  }

  List<ChatMessage> get _visibleMessages {
    final keyword = _messageSearchController.text.trim().toLowerCase();
    if (keyword.isEmpty) {
      return _messages;
    }
    return _messages.where((message) {
      final fileName = message.file?.name.toLowerCase() ?? '';
      return message.content.toLowerCase().contains(keyword) ||
          message.senderName.toLowerCase().contains(keyword) ||
          fileName.contains(keyword);
    }).toList();
  }

  bool _shouldShowSender(int index) {
    final messages = _visibleMessages;
    if (index == 0) {
      return true;
    }
    final previous = messages[index - 1];
    final current = messages[index];
    return previous.senderName != current.senderName;
  }

  bool _shouldShowTimestamp(int index) {
    final messages = _visibleMessages;
    if (index == messages.length - 1) {
      return true;
    }
    final current = messages[index];
    final next = messages[index + 1];
    return current.sentAt != next.sentAt;
  }

  int get _firstUnreadMessageIndex {
    for (var i = 0; i < _messages.length; i += 1) {
      if (!_messages[i].readStatus) {
        return i;
      }
    }
    return -1;
  }

  String _messageDayLabel(String sentAt) {
    return sentAt.length >= 10 ? sentAt.substring(0, 10) : sentAt;
  }

  bool _shouldShowDayDivider(int index) {
    final messages = _visibleMessages;
    if (index == 0) {
      return true;
    }
    return _messageDayLabel(messages[index - 1].sentAt) != _messageDayLabel(messages[index].sentAt);
  }

  bool _isImageAttachment(String extension, String mimeType) {
    final normalizedExtension = extension.toLowerCase();
    final normalizedMimeType = mimeType.toLowerCase();
    return normalizedMimeType.startsWith('image/') || const {'png', 'jpg', 'jpeg', 'gif', 'webp'}.contains(normalizedExtension);
  }

  IconData _attachmentIcon(String extension, String mimeType) {
    final normalizedExtension = extension.toLowerCase();
    final normalizedMimeType = mimeType.toLowerCase();
    if (_isImageAttachment(normalizedExtension, normalizedMimeType)) {
      return Icons.image_outlined;
    }
    if (normalizedExtension == 'pdf') {
      return Icons.picture_as_pdf_outlined;
    }
    if (const {'doc', 'docx'}.contains(normalizedExtension)) {
      return Icons.description_outlined;
    }
    if (const {'xls', 'xlsx', 'csv'}.contains(normalizedExtension)) {
      return Icons.table_chart_outlined;
    }
    return Icons.attach_file;
  }

  Color _attachmentAccentColor(String extension, String mimeType) {
    final normalizedExtension = extension.toLowerCase();
    final normalizedMimeType = mimeType.toLowerCase();
    if (_isImageAttachment(normalizedExtension, normalizedMimeType)) {
      return const Color(0xFF1D4ED8);
    }
    if (normalizedExtension == 'pdf') {
      return const Color(0xFFDC2626);
    }
    if (const {'doc', 'docx'}.contains(normalizedExtension)) {
      return const Color(0xFF2563EB);
    }
    if (const {'xls', 'xlsx', 'csv'}.contains(normalizedExtension)) {
      return const Color(0xFF15803D);
    }
    return const Color(0xFF667085);
  }

  String _attachmentTypeLabel(String extension, String mimeType) {
    final normalizedExtension = extension.toLowerCase();
    final normalizedMimeType = mimeType.toLowerCase();
    if (_isImageAttachment(normalizedExtension, normalizedMimeType)) {
      return '图片';
    }
    if (normalizedExtension == 'pdf') {
      return 'PDF';
    }
    if (const {'doc', 'docx'}.contains(normalizedExtension)) {
      return 'Word';
    }
    if (const {'xls', 'xlsx', 'csv'}.contains(normalizedExtension)) {
      return '表格';
    }
    return '文件';
  }

  bool get _isAdmin {
    return widget.currentUser.role == '管理员' || widget.currentUser.role == 'admin';
  }

  bool get _isCurrentUserLeader {
    return _members.any((m) => m.userId == widget.currentUser.id && m.role == '组长');
  }

  bool get _canImportPublicDocuments {
    return _isAdmin;
  }

  bool get _hasReachedGroupLimit {
    final subscription = _overview?.subscription;
    if (subscription == null || subscription.groupsLimit <= 0) {
      return false;
    }
    return subscription.groupsUsed >= subscription.groupsLimit;
  }

  bool get _hasReachedPrivateDocumentLimit {
    final subscription = _overview?.subscription;
    if (subscription == null || subscription.privateDocumentsLimit <= 0) {
      return false;
    }
    return subscription.privateDocumentsUsed >= subscription.privateDocumentsLimit;
  }

  bool get _hasReachedDailyQueryLimit {
    final subscription = _overview?.subscription;
    if (subscription == null || subscription.dailyQueriesLimit <= 0) {
      return false;
    }
    return subscription.dailyQueriesUsed >= subscription.dailyQueriesLimit;
  }

String get _activeConversationType {
    final conversation = _selectedConversation;
    if (conversation?.isTeamAgent ?? false) {
      return 'agent';
    }
    return conversation?.type == '群聊' ? 'group' : 'direct';
  }

  ConversationSummary? get _selectedConversation {
    for (final item in _conversations) {
      if (item.id == _selectedConversationId) {
        return item;
      }
    }
    return null;
  }

  String _getScopeLabel(String scope) {
    switch (scope) {
      case 'regulation': return '法条查询';
      case 'material': return '资料库问答';
      case 'case': return '案例参考';
      case 'risk': return '风险排查';
      default: return '检索';
    }
  }

  Color _getScopeColor(String scope) {
    switch (scope) {
      case 'regulation': return const Color(0xFF1D4ED8);
      case 'material': return const Color(0xFF0891B2);
      case 'case': return const Color(0xFF7C3AED);
      case 'risk': return const Color(0xFF059669);
      default: return Colors.grey;
    }
  }

  Future<void> _loadDashboard({String? preferredGroupId}) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final overview = await widget.apiService.fetchDashboard(groupId: preferredGroupId);
      final resolvedGroupId = _resolveGroupId(overview.groups, preferredGroupId);
      final bundle = await _loadGroupBundle(resolvedGroupId);
      final queryHistory = await widget.apiService.getQueryHistory(teamId: resolvedGroupId);

      if (!mounted) {
        return;
      }

      setState(() {
        _overview = overview;
        _selectedGroupId = resolvedGroupId;
        _result = overview.featuredQuery;
        _conversations = bundle.conversations;
        _members = bundle.members;
        _documents = bundle.documents;
        _extractJobs = bundle.extractJobs;
        _selectedConversationId = bundle.selectedConversationId;
        _messages = bundle.messages;
        _queryHistory = queryHistory;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (e) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '工作台数据加载失败：$e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _switchGroup(String? groupId) async {
    if (_isAdmin || groupId == null || groupId == _selectedGroupId) {
      return;
    }

    setState(() {
      _switchingGroup = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        widget.apiService.fetchDashboard(groupId: groupId),
        _loadGroupBundle(groupId),
        widget.apiService.getQueryHistory(teamId: groupId),
      ]);
      final overview = results[0] as DashboardOverview;
      final bundle = results[1] as _GroupBundle;
      final queryHistory = results[2] as List<Map<String, dynamic>>;

      if (!mounted) {
        return;
      }

      setState(() {
        _overview = overview;
        _selectedGroupId = groupId;
        _result = overview.featuredQuery;
        _conversations = bundle.conversations;
        _members = bundle.members;
        _documents = bundle.documents;
        _extractJobs = bundle.extractJobs;
        _selectedConversationId = bundle.selectedConversationId;
        _messages = bundle.messages;
        _queryHistory = queryHistory;
        if (_selectedIndex == 1 && _selectedConversationId == null && bundle.conversations.isEmpty) {
          _selectedIndex = 0;
        }
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '项目组切换失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _switchingGroup = false;
        });
      }
    }
  }

  Future<_GroupBundle> _loadGroupBundle(String? groupId) async {
    final results = await Future.wait([
      _isAdmin ? Future.value(const <ConversationSummary>[]) : widget.apiService.fetchConversations(groupId: groupId),
      _isAdmin || groupId == null ? Future.value(const <GroupMember>[]) : widget.apiService.fetchMembers(groupId),
      widget.apiService.fetchDocuments(groupId: _isAdmin ? null : groupId),
      widget.apiService.fetchExtractionJobs(groupId: _isAdmin ? null : groupId),
    ]);

    final conversations = results[0] as List<ConversationSummary>;
    final members = results[1] as List<GroupMember>;
    final documents = results[2] as List<KnowledgeDocument>;
    final extractJobs = results[3] as List<ExtractionJob>;
    final selectedConversationId = _pickConversationId(conversations, groupId);
    final messages = _isAdmin || selectedConversationId == null
        ? const <ChatMessage>[]
        : await widget.apiService.fetchMessages(selectedConversationId);

    return _GroupBundle(
      conversations: conversations,
      members: members,
      documents: documents,
      extractJobs: extractJobs,
      selectedConversationId: selectedConversationId,
      messages: messages,
    );
  }

  String? _resolveGroupId(List<ProjectGroup> groups, String? preferredGroupId) {
    if (_isAdmin || groups.isEmpty) {
      return null;
    }

    for (final group in groups) {
      if (group.id == preferredGroupId) {
        return group.id;
      }
    }

    return groups.first.id;
  }

  String? _pickConversationId(List<ConversationSummary> conversations, String? groupId) {
    if (conversations.isEmpty) {
      return null;
    }

    final sortedConversations = [...conversations]
      ..sort((a, b) {
        final aPinned = _pinnedConversationIds.contains(a.id);
        final bPinned = _pinnedConversationIds.contains(b.id);
        if (aPinned != bPinned) {
          return aPinned ? -1 : 1;
        }
        if (a.unreadCount != b.unreadCount) {
          return b.unreadCount.compareTo(a.unreadCount);
        }
        if (a.isTeamAgent != b.isTeamAgent) {
          return a.isTeamAgent ? -1 : 1;
        }
        return b.lastMessageAt.compareTo(a.lastMessageAt);
      });

    if (groupId != null) {
      for (final conversation in sortedConversations) {
        if (conversation.isTeamAgent && conversation.groupId == groupId) {
          return conversation.id;
        }
      }
      for (final conversation in sortedConversations) {
        if (conversation.type == '群聊' && conversation.groupId == groupId) {
          return conversation.id;
        }
      }
    }

    return sortedConversations.first.id;
  }

  Future<void> _restorePinnedConversations() async {
    final prefs = await SharedPreferences.getInstance();
    final pinnedIds = prefs.getStringList(_pinnedConversationIdsKey) ?? const <String>[];
    if (!mounted) {
      return;
    }
    setState(() {
      _pinnedConversationIds = pinnedIds.toSet();
    });
  }

  Future<void> _togglePinnedConversation(String conversationId) async {
    final nextPinnedIds = _pinnedConversationIds.contains(conversationId)
        ? (_pinnedConversationIds.toSet()..remove(conversationId))
        : (_pinnedConversationIds.toSet()..add(conversationId));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_pinnedConversationIdsKey, nextPinnedIds.toList());
    if (!mounted) {
      return;
    }
    setState(() {
      _pinnedConversationIds = nextPinnedIds;
    });
  }

  Future<void> _restoreMutedConversations() async {
    final prefs = await SharedPreferences.getInstance();
    final mutedIds = prefs.getStringList(_mutedConversationIdsKey) ?? const <String>[];
    if (!mounted) {
      return;
    }
    setState(() {
      _mutedConversationIds = mutedIds.toSet();
    });
  }

  Future<void> _toggleMutedConversation(String conversationId) async {
    final nextMutedIds = _mutedConversationIds.contains(conversationId)
        ? (_mutedConversationIds.toSet()..remove(conversationId))
        : (_mutedConversationIds.toSet()..add(conversationId));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_mutedConversationIdsKey, nextMutedIds.toList());
    if (!mounted) {
      return;
    }
    setState(() {
      _mutedConversationIds = nextMutedIds;
    });
  }

  Future<void> _runSearch() async {
    final question = _questionController.text.trim();
    final searchGroupId = _isAdmin ? null : _activeGroupId;
    if (question.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入审计问题后再执行检索。')));
      return;
    }

    if (!_isAdmin && _hasReachedDailyQueryLimit) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('今日 RAG 查询次数已用完，请明日再试或升级套餐。')));
      return;
    }

    setState(() {
      _searching = true;
      _error = null;
    });

    try {
      final result = await widget.apiService.search(
        question: question,
        groupId: searchGroupId,
        agentId: _overview?.activeTeamAgent?.id,
        queryScope: _queryScope,
      );
      if (!mounted) {
        return;
      }
      final resolvedGroupId = _isAdmin ? null : _activeGroupId;
      final queryHistory = await widget.apiService.getQueryHistory(teamId: resolvedGroupId);
      if (!mounted) {
        return;
      }
      setState(() {
        _result = result;
        _queryHistory = queryHistory;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '检索失败，请检查后端查询接口。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _searching = false;
        });
      }
    }
  }

  void _scrollMessagesToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_messagesScrollController.hasClients) {
        return;
      }
      _messagesScrollController.animateTo(
        _messagesScrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
      );
    });
  }

  void _jumpToFirstUnreadMessage() {
    final index = _firstUnreadMessageIndex;
    if (index < 0) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_messagesScrollController.hasClients) {
        return;
      }
      final targetOffset = (index * 120).toDouble();
      final maxOffset = _messagesScrollController.position.maxScrollExtent;
      _messagesScrollController.animateTo(
        targetOffset.clamp(0, maxOffset),
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _loadConversationMessages(String conversationId) async {
    if (_isAdmin) {
      return;
    }

    setState(() {
      _chatLoading = true;
      _selectedConversationId = conversationId;
      _error = null;
      _pendingMessages = const [];
    });

    try {
      final messages = await widget.apiService.fetchMessages(conversationId);
      if (!mounted) {
        return;
      }
      setState(() {
        _messages = messages;
      });
      _scrollMessagesToBottom();
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '消息加载失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _chatLoading = false;
        });
      }
    }
  }

  Future<void> _openChatAttachment(ChatAttachment attachment) async {
    try {
      await widget.apiService.openFilePath(attachment.path);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('打开文件失败。')));
    }
  }

  Future<void> _downloadChatAttachment({
    required String messageId,
    required ChatAttachment attachment,
  }) async {
    try {
      final conversationId = _selectedConversationId;
      if (conversationId == null) {
        return;
      }
      final savedPath = await widget.apiService.downloadChatMessageFile(
        conversationId: conversationId,
        messageId: messageId,
        fileName: attachment.name,
      );
      if (!mounted) {
        return;
      }
      if (savedPath == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('文件已开始下载。')));
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('文件已保存到：$savedPath')));
      await widget.apiService.openFilePath(savedPath);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      if (error.message == '已取消保存文件') {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('下载或打开文件失败：$error')));
    }
  }

  List<ChatAttachment> get _imageAttachments {
    return _messages
        .where((message) => message.messageType == 'file' && message.file != null)
        .map((message) => message.file!)
        .where((file) => _isImageAttachment(file.extension, file.mimeType))
        .toList();
  }

  void _previewImageAttachment(ChatAttachment attachment) {
    final imageAttachments = _imageAttachments;
    final initialIndex = imageAttachments.indexWhere((item) => item.path == attachment.path);
    showDialog<void>(
      context: context,
      builder: (context) {
        return _ImagePreviewDialog(
          attachments: imageAttachments,
          initialIndex: initialIndex < 0 ? 0 : initialIndex,
          buildImageUrl: (path) => widget.apiService.buildFileUri(path).toString(),
          onOpenOriginal: _openChatAttachment,
        );
      },
    );
  }

  void _handleAttachmentTap(ChatAttachment attachment) {
    if (_isImageAttachment(attachment.extension, attachment.mimeType)) {
      _previewImageAttachment(attachment);
      return;
    }
    _openChatAttachment(attachment);
  }

  Future<void> _pickChatFiles() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: const ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'],
        withData: true,
        allowMultiple: true,
      );
      if (!mounted || result == null) {
        return;
      }
      final pickedFiles = result.files.where((file) => file.name.trim().isNotEmpty).toList();
      if (pickedFiles.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('未读取到所选文件，请重试一次。')));
        return;
      }
      setState(() {
        _selectedMessageFiles = [..._selectedMessageFiles, ...pickedFiles];
      });
    } on PlatformException {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('文件选择失败，请重试。')));
    }
  }

  Future<void> _retryPendingMessage(String pendingId) async {
    final pending = _pendingMessages.where((item) => item.id == pendingId).firstOrNull;
    if (pending == null) {
      return;
    }
    _messageController.text = pending.content;
    setState(() {
      _selectedMessageFiles = pending.file == null ? const [] : [pending.file!];
      _pendingMessages = _pendingMessages.where((item) => item.id != pendingId).toList();
    });
    await _sendMessage();
  }

  Future<void> _clearConversationMessages() async {
    if (_selectedConversationId == null) {
      return;
    }
    try {
      await widget.apiService.clearConversationMessages(_selectedConversationId!);
      await _loadConversationMessages(_selectedConversationId!);
      if (!mounted) {
        return;
      }
      await _loadDashboard(preferredGroupId: _activeGroupId);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('会话消息已清空。')));
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('清空会话失败。')));
    }
  }

  Future<void> _deleteSelectedDirectConversation() async {
    final conversation = _selectedConversation;
    if (conversation == null || conversation.type != '私信') {
      return;
    }
    try {
      await widget.apiService.deleteDirectConversation(conversation.id);
      await _loadDashboard(preferredGroupId: _activeGroupId);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('私聊会话已删除。')));
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('删除私聊会话失败。')));
    }
  }

  Future<void> _deleteMessage(ChatMessage message) async {
    if (_selectedConversationId == null) {
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除消息'),
        content: const Text('删除后将无法恢复，是否继续？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('确认删除')),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }
    try {
      await widget.apiService.deleteMessage(
        conversationId: _selectedConversationId!,
        messageId: message.id,
      );
      await _loadConversationMessages(_selectedConversationId!);
      if (!mounted) {
        return;
      }
      await _loadDashboard(preferredGroupId: _activeGroupId);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('消息已删除。')));
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('删除消息失败。')));
    }
  }

  Future<void> _recallMessage(ChatMessage message) async {
    if (_selectedConversationId == null) {
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认撤回消息'),
        content: const Text('撤回后会保留一条“该消息已撤回”的提示。是否继续？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('确认撤回')),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }
    try {
      await widget.apiService.recallMessage(
        conversationId: _selectedConversationId!,
        messageId: message.id,
      );
      await _loadConversationMessages(_selectedConversationId!);
      if (!mounted) {
        return;
      }
      await _loadDashboard(preferredGroupId: _activeGroupId);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('消息已撤回。')));
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('撤回消息失败。')));
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    final selectedFiles = [..._selectedMessageFiles];
    if (_isAdmin || _selectedConversationId == null) {
      return;
    }

    if (content.isEmpty && selectedFiles.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入消息或选择文件后再发送。')));
      return;
    }

    final pendingMessages = selectedFiles.isEmpty
        ? [
            _PendingChatMessage(
              id: 'pending-${DateTime.now().microsecondsSinceEpoch}',
              content: content,
              file: null,
              sentAt: DateTime.now().toIso8601String().replaceFirst('T', ' ').substring(0, 16),
              status: _PendingChatMessageStatus.sending,
              progress: 1,
            ),
          ]
        : selectedFiles
            .asMap()
            .entries
            .map(
              (entry) => _PendingChatMessage(
                id: 'pending-${DateTime.now().microsecondsSinceEpoch}-${entry.key}',
                content: content,
                file: entry.value,
                sentAt: DateTime.now().toIso8601String().replaceFirst('T', ' ').substring(0, 16),
                status: _PendingChatMessageStatus.sending,
                progress: 0,
              ),
            )
            .toList();

    setState(() {
      _sendingMessage = true;
      _error = null;
      _pendingMessages = [..._pendingMessages, ...pendingMessages];
    });
    _messageController.clear();
    _selectedMessageFiles = const [];
    _scrollMessagesToBottom();

    try {
      for (final pending in pendingMessages) {
        await widget.apiService.sendMessage(
          conversationId: _selectedConversationId!,
          conversationType: _activeConversationType,
          content: content.isEmpty ? null : content,
          file: pending.file,
          groupId: _activeConversationType == 'group' ? _activeGroupId : null,
          onSendProgress: pending.file == null
              ? null
              : (progress) {
                  if (!mounted) {
                    return;
                  }
                  setState(() {
                    _pendingMessages = _pendingMessages
                        .map((item) => item.id == pending.id ? item.copyWith(progress: progress) : item)
                        .toList();
                  });
                },
        );
        if (!mounted) {
          return;
        }
        setState(() {
          _pendingMessages = _pendingMessages.where((item) => item.id != pending.id).toList();
        });
      }
      await _loadConversationMessages(_selectedConversationId!);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      final failedIds = pendingMessages.map((item) => item.id).toSet();
      setState(() {
        _error = error.message;
        _pendingMessages = _pendingMessages
            .map((item) => failedIds.contains(item.id) ? item.copyWith(status: _PendingChatMessageStatus.failed, error: error.message) : item)
            .toList();
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }
      final failedIds = pendingMessages.map((item) => item.id).toSet();
      setState(() {
        _error = '消息发送失败。';
        _pendingMessages = _pendingMessages
            .map((item) => failedIds.contains(item.id) ? item.copyWith(status: _PendingChatMessageStatus.failed, error: '消息发送失败。') : item)
            .toList();
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('消息发送失败，请重试。')));
    } finally {
      if (mounted) {
        setState(() {
          _sendingMessage = false;
        });
      }
    }
  }

  Future<void> _refreshMembers() async {
    if (_isAdmin || _activeGroupId == null) {
      return;
    }

    setState(() {
      _membersLoading = true;
      _error = null;
    });

    try {
      final members = await widget.apiService.fetchMembers(_activeGroupId!);
      if (!mounted) {
        return;
      }
      setState(() {
        _members = members;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '成员列表加载失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _membersLoading = false;
        });
      }
    }
  }

  Future<void> _refreshDocuments() async {
    setState(() {
      _documentsLoading = true;
      _error = null;
    });

    try {
      final documents = await widget.apiService.fetchDocuments(groupId: _isAdmin ? null : _activeGroupId);
      final jobs = await widget.apiService.fetchExtractionJobs(groupId: _isAdmin ? null : _activeGroupId);
      if (!mounted) {
        return;
      }
      setState(() {
        _documents = documents;
        _extractJobs = jobs;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '文档与抽取任务加载失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _documentsLoading = false;
        });
      }
    }
  }

  Future<void> _subscribe(String planType) async {
    if (_isAdmin) return;

    final s = _overview?.subscription;
    final planMap = {
      'weekly':  (_PlanOption(id: 'weekly',  label: '周订阅',  price: s?.weeklyPrice  ?? '¥70',   duration: '7 天'),),
      'monthly': (_PlanOption(id: 'monthly', label: '月订阅',  price: s?.monthlyPrice ?? '¥200',  duration: '30 天'),),
      'yearly':  (_PlanOption(id: 'yearly',  label: '年订阅',  price: s?.yearlyPrice  ?? '¥2000', duration: '365 天'),),
    };
    final plan = planMap[planType]?.$1;
    if (plan == null || !mounted) return;

    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PaymentPage(
          planId: plan.id,
          planLabel: plan.label,
          price: plan.price,
          duration: plan.duration,
          onCancel: () => Navigator.of(context).pop(),
          onPaid: () async {
            Navigator.of(context).pop();
            setState(() { _subscribing = true; _error = null; });
            try {
              await widget.apiService.createSubscriptionOrder(planType: planType);
              await _loadDashboard(preferredGroupId: _activeGroupId);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${plan.label} 已开通。')));
            } on ApiException catch (error) {
              if (!mounted) return;
              setState(() => _error = error.message);
            } catch (_) {
              if (!mounted) return;
              setState(() => _error = '订阅开通失败。');
            } finally {
              if (mounted) setState(() => _subscribing = false);
            }
          },
        ),
      ),
    );
  }

  Future<void> _buyLibraryAccess(String libraryType, String? region) async {
    if (_isAdmin) return;
    setState(() { _subscribing = true; _error = null; });
    try {
      await widget.apiService.buyLibraryAccess(libraryType: libraryType, region: region);
      await _loadDashboard(preferredGroupId: _activeGroupId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('知识库访问权限已开通。')));
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = '购买失败，请重试。');
    } finally {
      if (mounted) setState(() => _subscribing = false);
    }
  }

  Future<void> _showMemberInfoDialog(GroupMember member) async {
    final isCurrentUser = member.userId == widget.currentUser.id;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(member.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('手机号：${member.phone}'),
            const SizedBox(height: 4),
            Text('角色：${member.role}'),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('关闭')),
          if (!isCurrentUser)
            FilledButton(
              onPressed: () async {
                Navigator.pop(context);
                await _startDirectChat(member);
              },
              child: const Text('发起私聊'),
            ),
        ],
      ),
    );
  }

  Future<void> _startDirectChat(GroupMember member) async {
    try {
      final conversation = await widget.apiService.createDirectConversation(targetUserId: member.userId);
      if (!mounted) return;
      // 重新加载会话列表（包含私信会话）
      final conversations = await widget.apiService.fetchConversations(groupId: _activeGroupId);
      if (!mounted) return;
      setState(() {
        _conversations = conversations;
        _selectedConversationId = conversation.id;
        _selectedIndex = 1;
      });
      await _loadConversationMessages(conversation.id);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('发起私聊失败：$e')));
    }
  }

  Future<void> _showEditNameDialog(String currentName) async {
    final controller = TextEditingController(text: currentName);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('修改姓名'),
        content: TextField(controller: controller, decoration: const InputDecoration(labelText: '姓名'), autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('保存')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    final name = controller.text.trim();
    if (name.isEmpty) return;
    try {
      await widget.apiService.updateProfile(name: name);
      await _loadDashboard();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('修改失败：$e')));
    }
  }

  Future<void> _showCreateGroupDialog() async {
    if (_isAdmin) {
      return;
    }

    if (_hasReachedGroupLimit) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('当前套餐的项目组数量已达上限，请升级后继续创建。')));
      return;
    }

    final nameController = TextEditingController();
    final organizationController = TextEditingController();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('创建项目组'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: '项目组名称')),
            const SizedBox(height: 12),
            TextField(
              controller: organizationController,
              decoration: const InputDecoration(labelText: '被审计单位'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(
            onPressed: () {
              if (nameController.text.trim().isEmpty || organizationController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('请填写项目组名称和被审计单位。')),
                );
                return;
              }
              Navigator.pop(context, true);
            },
            child: const Text('创建'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    try {
      final newGroup = await widget.apiService.createGroup(
        name: nameController.text.trim(),
        organizationName: organizationController.text.trim(),
      );
      await _loadDashboard(preferredGroupId: newGroup.id);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    }
  }

  Future<void> _showInviteDialog() async {
    if (_isAdmin || _activeGroupId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请先选择项目组后再邀请成员。')));
      return;
    }

    final phoneController = TextEditingController();
    String selectedRole = '成员';
    String? dialogError;
    bool loading = false;

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('邀请成员'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: phoneController, decoration: const InputDecoration(labelText: '手机号')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedRole,
                items: const [
                  DropdownMenuItem(value: '成员', child: Text('成员')),
                ],
                onChanged: (value) => setDialogState(() => selectedRole = value ?? '成员'),
                decoration: const InputDecoration(labelText: '角色'),
              ),
              if (dialogError != null) ...[
                const SizedBox(height: 8),
                Text(dialogError!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ],
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('取消')),
            FilledButton(
              onPressed: loading
                  ? null
                  : () async {
                      final phone = phoneController.text.trim();
                      if (phone.isEmpty || phone.length < 11) {
                        setDialogState(() => dialogError = '请输入 11 位手机号后再发送邀请。');
                        return;
                      }
                      setDialogState(() { dialogError = null; loading = true; });
                      try {
                        await widget.apiService.inviteMember(
                          groupId: _activeGroupId!,
                          phone: phone,
                          role: selectedRole,
                        );
                        if (context.mounted) Navigator.pop(context);
                        await _refreshMembers();
                      } on ApiException catch (e) {
                        setDialogState(() { dialogError = e.message; loading = false; });
                      }
                    },
              child: const Text('发送邀请'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showTransferLeaderDialog() async {
    if (_isAdmin || _activeGroupId == null) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请先选择项目组后再移交组长。')));
      return;
    }

    if (_members.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('当前项目组暂无可移交成员。')));
      return;
    }

    String? selectedUserId = _members.first.userId;
    String? dialogError;
    bool loading = false;

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('移交组长'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: selectedUserId,
                items: _members
                    .map((member) => DropdownMenuItem(
                          value: member.userId,
                          child: Text('${member.name} · ${member.role}'),
                        ))
                    .toList(),
                onChanged: (value) => setDialogState(() => selectedUserId = value),
                decoration: const InputDecoration(labelText: '选择目标成员'),
              ),
              if (dialogError != null) ...[
                const SizedBox(height: 8),
                Text(dialogError!, style: const TextStyle(color: Colors.red, fontSize: 13)),
              ],
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('取消')),
            FilledButton(
              onPressed: loading
                  ? null
                  : () async {
                      if (selectedUserId == null) return;
                      setDialogState(() { dialogError = null; loading = true; });
                      try {
                        await widget.apiService.transferLeader(
                          groupId: _activeGroupId!,
                          targetUserId: selectedUserId!,
                        );
                        if (context.mounted) Navigator.pop(context);
                        await _refreshMembers();
                      } on ApiException catch (e) {
                        setDialogState(() { dialogError = e.message; loading = false; });
                      }
                    },
              child: const Text('确认移交'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _removeMember(GroupMember member) async {
    if (_isAdmin || _activeGroupId == null || member.role == '组长') {
      return;
    }

    final isSelf = member.userId == widget.currentUser.id;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isSelf ? '确认退出项目组' : '确认清退成员'),
        content: Text(isSelf ? '确定要退出当前项目组吗？' : '确定要将 ${member.name} 移出当前项目组吗？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(isSelf ? '确认退出' : '确认清退')),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    setState(() {
      _membersLoading = true;
      _error = null;
    });

    try {
      await widget.apiService.removeMember(groupId: _activeGroupId!, memberId: member.id);
      if (isSelf) {
        await _loadDashboard();
        if (!mounted) {
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('你已退出当前项目组。')));
      } else {
        await _refreshMembers();
        await _loadDashboard(preferredGroupId: _activeGroupId);
        if (!mounted) {
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('成员已清退。')));
      }
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = isSelf ? '退出项目组失败。' : '成员清退失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _membersLoading = false;
        });
      }
    }
  }

  Future<void> _deleteDocument(KnowledgeDocument document) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认删除文件'),
        content: Text('确定要删除《${document.title}》吗？相关文本块也会一并移除。'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('确认删除')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await widget.apiService.deleteDocument(documentId: document.id);
      await _refreshDocuments();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('文件已删除。')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('删除失败。')));
    }
  }

  Future<void> _deleteGroup(ProjectGroup group) async {
    if (_isAdmin) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认删除项目组'),
        content: Text('确定要删除 ${group.name} 吗？该项目组成员与私有库文档也会一起移除。'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('确认删除')),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    setState(() {
      _switchingGroup = true;
      _error = null;
    });

    try {
      await widget.apiService.deleteGroup(groupId: group.id);
      await _loadDashboard();
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = '项目组删除失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _switchingGroup = false;
        });
      }
    }
  }

  Future<void> _copyChunkContent(String content) async {
    await Clipboard.setData(ClipboardData(text: content));
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('文本块内容已复制。')));
  }

  Future<void> _copyMessageContent(String content) async {
    if (content.trim().isEmpty) {
      return;
    }
    await Clipboard.setData(ClipboardData(text: content));
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('消息内容已复制。')));
  }

  Future<void> _copyAttachmentPath(ChatAttachment attachment) async {
    await Clipboard.setData(ClipboardData(text: attachment.path));
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('附件路径已复制。')));
  }

  Future<void> _showDocumentChunksDialog(KnowledgeDocument document) async {
    try {
      final chunks = await widget.apiService.fetchDocumentChunks(document.id);
      if (!mounted) {
        return;
      }

      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(document.title),
          content: SizedBox(
            width: 720,
            child: chunks.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('当前文档还没有可预览的文本块。'),
                  )
                : SizedBox(
                    height: 600,
                    child: ListView.builder(
                      itemCount: chunks.length,
                      itemBuilder: (context, i) {
                        final chunk = chunks[i];
                        return Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFDCE6F5)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  Chip(label: Text(chunk.chapterTitle)),
                                  Chip(label: Text(chunk.articleRef)),
                                  Chip(label: Text(chunk.pageLabel)),
                                  Chip(label: Text(chunk.indexStatus)),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(chunk.content),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton(
                                    onPressed: () => _copyChunkContent(chunk.content),
                                    child: const Text('复制文本块'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: chunk.keywords.map((keyword) => Chip(label: Text(keyword))).toList(),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('关闭'))],
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    }
  }

  Future<void> _showCaseDetailDialog(QueryCitation citation) async {
    try {
      final chunks = await widget.apiService.fetchDocumentChunks(citation.documentId);
      if (!mounted) {
        return;
      }

      await showDialog<void>(
        context: context,
        builder: (dialogContext) {
          final theme = Theme.of(dialogContext);
          return AlertDialog(
            title: Text(citation.title),
            content: SizedBox(
              width: 760,
              child: chunks.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Text('当前案例暂无可预览的完整内容。'),
                    )
                  : SizedBox(
                      height: 620,
                      child: ListView(
                        children: [
                          Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.secondaryContainer.withValues(alpha: 0.35),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: theme.colorScheme.outlineVariant),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    Chip(label: Text(citation.libraryType)),
                                    if (citation.chapterTitle.isNotEmpty) Chip(label: Text(citation.chapterTitle)),
                                    if (citation.articleRef.isNotEmpty) Chip(label: Text(citation.articleRef)),
                                    Chip(label: Text('相关度 ${(citation.score * 100).toStringAsFixed(0)}%')),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                SelectableText(citation.matchedChunk, style: theme.textTheme.bodyMedium),
                              ],
                            ),
                          ),
                          ...chunks.map((chunk) => Container(
                            width: double.infinity,
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerLowest,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFDCE6F5)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    if (chunk.chapterTitle.isNotEmpty) Chip(label: Text(chunk.chapterTitle)),
                                    if (chunk.articleRef.isNotEmpty) Chip(label: Text(chunk.articleRef)),
                                    if (chunk.pageLabel.isNotEmpty) Chip(label: Text(chunk.pageLabel)),
                                    if (chunk.indexStatus.isNotEmpty) Chip(label: Text(chunk.indexStatus)),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: SelectableText(chunk.content, style: theme.textTheme.bodyMedium),
                                    ),
                                    const SizedBox(width: 8),
                                    TextButton(
                                      onPressed: () => _copyChunkContent(chunk.content),
                                      child: const Text('复制文本块'),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          )),
                        ],
                      ),
                    ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('关闭'),
              ),
            ],
          );
        },
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('加载案例详情失败：${error.message}')));
    }
  }

  Future<void> _showImportDocumentDialog() async {
    if (_activeGroupId == null && !_canImportPublicDocuments) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('公共库仅允许管理员导入，请先联系管理员或进入项目组导入私有资料。')));
      return;
    }

    if (_activeGroupId == null) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isAdmin ? '当前为管理员公共库视角，将导入到公共库。' : '当前未选择项目组，普通成员不能导入公共库；如需导入资料，请先进入项目组后上传到私有库。'),
        ),
      );
    }

    if (_hasReachedPrivateDocumentLimit) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('当前套餐的私有库文件数量已达上限，请升级后继续导入。')));
      return;
    }

    final titleController = TextEditingController();
    final rawTextController = TextEditingController();
    String libraryType = _isAdmin || _activeGroupId == null ? 'regulation' : 'private';
    String privateScope = 'group'; // 'personal' | 'group'
    String? region;
    PlatformFile? selectedFile;
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('选择文件上传'),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(controller: titleController, decoration: const InputDecoration(labelText: '文件标题')),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        final result = await FilePicker.platform.pickFiles(
                          type: FileType.custom,
                          allowedExtensions: const ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'],
                          withData: true,
                        );
                        if (result == null || result.files.isEmpty) {
                          return;
                        }
                        setDialogState(() {
                          selectedFile = result.files.single;
                          if (titleController.text.trim().isEmpty) {
                            titleController.text = result.files.single.name;
                          }
                        });
                      } on PlatformException catch (error) {
                        if (!mounted) {
                          return;
                        }
                        scaffoldMessenger.showSnackBar(
                          SnackBar(content: Text('选择文件失败：${error.message ?? '请检查当前运行环境的文件选择权限。'}')),
                        );
                      } catch (_) {
                        if (!mounted) {
                          return;
                        }
                        scaffoldMessenger.showSnackBar(
                          const SnackBar(content: Text('选择文件失败，请重试一次或重启预览环境。')),
                        );
                      }
                    },
                    icon: const Icon(Icons.upload_file_outlined),
                    label: const Text('选择文件'),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    selectedFile == null ? '尚未选择文件' : '已选择：${selectedFile!.name}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '支持上传 pdf、docx、xlsx、png、jpg、jpeg 文件。',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: libraryType,
                    items: [
                      if (_isAdmin) ...[
                        const DropdownMenuItem(value: 'regulation', child: Text('法规库')),
                        const DropdownMenuItem(value: 'local_policy', child: Text('地方政策库')),
                        const DropdownMenuItem(value: 'national_case', child: Text('全国案例库')),
                        const DropdownMenuItem(value: 'local_case', child: Text('地方案例库')),
                        const DropdownMenuItem(value: 'industry', child: Text('行业专题库')),
                      ],
                      if (_isCurrentUserLeader && _activeGroupId != null)
                        const DropdownMenuItem(value: 'private', child: Text('私有库')),
                    ],
                    onChanged: (value) => setDialogState(() {
                      libraryType = value ?? libraryType;
                      region = null;
                    }),
                    decoration: const InputDecoration(labelText: '入库范围'),
                  ),
                  if (libraryType == 'private' && _activeGroupId != null) ...[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: privateScope,
                      decoration: const InputDecoration(labelText: '私有库范围'),
                      items: const [
                        DropdownMenuItem(value: 'personal', child: Text('个人私有库（仅自己可见）')),
                        DropdownMenuItem(value: 'group', child: Text('项目组私有库（组内成员可检索）')),
                      ],
                      onChanged: (v) => setDialogState(() => privateScope = v ?? privateScope),
                    ),
                  ],
                  if (libraryType == 'local_policy' || libraryType == 'local_case') ...[
                    const SizedBox(height: 12),
                    Autocomplete<String>(
                      optionsBuilder: (v) => v.text.isEmpty ? _kRegions : _kRegions.where((r) => r.contains(v.text)),
                      onSelected: (v) => setDialogState(() => region = v),
                      fieldViewBuilder: (ctx2, ctrl, fn, _) => TextField(
                        controller: ctrl,
                        focusNode: fn,
                        decoration: const InputDecoration(labelText: '地区（可选）'),
                        onChanged: (v) => region = v.trim().isEmpty ? null : v.trim(),
                      ),
                    ),
                  ],
                  if (libraryType == 'industry') ...[
                    const SizedBox(height: 12),
                    Autocomplete<String>(
                      optionsBuilder: (v) {
                        final history = _documents
                            .where((d) => d.libraryType == '行业专题库' && (d.region?.isNotEmpty ?? false))
                            .map((d) => d.region!)
                            .toSet()
                            .toList();
                        return v.text.isEmpty ? history : history.where((r) => r.contains(v.text));
                      },
                      onSelected: (v) => setDialogState(() => region = v),
                      fieldViewBuilder: (ctx2, ctrl, fn, _) => TextField(
                        controller: ctrl,
                        focusNode: fn,
                        decoration: const InputDecoration(labelText: '行业（可选，如：医疗、建筑）'),
                        onChanged: (v) => region = v.trim().isEmpty ? null : v.trim(),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: rawTextController,
                    minLines: 6,
                    maxLines: 10,
                    decoration: const InputDecoration(
                      labelText: '文档正文（可选）',
                      alignLabelWithHint: true,
                      hintText: '可直接粘贴制度正文，导入后会优先按正文切分条款级 chunk。',
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
            FilledButton(
              onPressed: selectedFile == null ? null : () => Navigator.pop(context, true),
              child: const Text('导入'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || selectedFile == null) {
      return;
    }

    final title = titleController.text.trim();
    if (title.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请填写文件标题后再导入。')));
      return;
    }

    try {
      final result = await widget.apiService.importDocument(
        title: title,
        libraryType: libraryType,
        file: selectedFile!,
        region: region,
        rawText: rawTextController.text.trim().isEmpty ? null : rawTextController.text.trim(),
        groupId: libraryType == 'private' && privateScope == 'group' ? _activeGroupId : null,
      );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.notes)));
      await _refreshDocuments();
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_error != null && _overview == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('小嘉审计助手'),
          actions: [TextButton(onPressed: widget.onLogout, child: const Text('退出'))],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(onPressed: _loadDashboard, child: const Text('重试加载')),
              ],
            ),
          ),
        ),
      );
    }

    final overview = _overview!;
    final result = _result ?? overview.featuredQuery;

    final pages = <_NavPage>[
      _NavPage(
        label: '工作台',
        icon: Icons.dashboard_outlined,
        child: _buildWorkspace(
          context,
          overview.user,
          overview.groups,
          _documents,
          _extractJobs,
          overview.subscription,
          result,
          overview.activeContext,
          overview.roadmap,
          overview.architectureTargets,
        ),
      ),
      if (!_isAdmin)
        _NavPage(
          label: '对话',
          icon: Icons.chat_bubble_outline,
          child: _buildChat(),
        ),
      _NavPage(
        label: '我的',
        icon: Icons.person_outline,
        child: _buildAccount(overview.user, overview.subscription),
      ),
    ];

    final compact = MediaQuery.of(context).size.width < 900;

    if (compact) {
      return Scaffold(
        appBar: AppBar(
          title: Row(
            children: [
              Icon(Icons.analytics_outlined, color: Theme.of(context).colorScheme.primary, size: 20),
              const SizedBox(width: 6),
              const Text('小嘉审计助手'),
            ],
          ),
          actions: [
            IconButton(onPressed: () => _loadDashboard(preferredGroupId: _selectedGroupId), icon: const Icon(Icons.refresh_outlined)),
            IconButton(onPressed: widget.onLogout, icon: const Icon(Icons.logout), tooltip: '退出'),
          ],
        ),
        body: pages[_selectedIndex].child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          destinations: pages
              .map((page) => NavigationDestination(icon: Icon(page.icon), label: page.label))
              .toList(),
          onDestinationSelected: (index) { setState(() => _selectedIndex = index); _loadDashboard(); },
        ),
      );
    }

    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.analytics_outlined, color: theme.colorScheme.primary, size: 22),
            const SizedBox(width: 8),
            const Text('小嘉审计助手'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => _loadDashboard(preferredGroupId: _selectedGroupId),
            icon: const Icon(Icons.refresh_outlined),
            tooltip: '刷新',
          ),
          const SizedBox(width: 4),
          TextButton.icon(
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout, size: 16),
            label: const Text('退出'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _selectedIndex,
            labelType: NavigationRailLabelType.all,
            onDestinationSelected: (index) { setState(() => _selectedIndex = index); _loadDashboard(); },
            destinations: pages
                .map((page) => NavigationRailDestination(icon: Icon(page.icon), label: Text(page.label)))
                .toList(),
          ),
          const VerticalDivider(width: 1),
          Expanded(child: pages[_selectedIndex].child),
        ],
      ),
    );
  }

  Widget _buildWorkspace(
    BuildContext context,
    AppUser user,
    List<ProjectGroup> groups,
    List<KnowledgeDocument> documents,
    List<ExtractionJob> extractJobs,
    SubscriptionOverview subscription,
    QueryResult result,
    ActiveContext activeContext,
    List<RoadmapItem> roadmap,
    ArchitectureTargets architectureTargets,
  ) {
    final compact = MediaQuery.of(context).size.width < 900;

    if (compact) {
      return _buildWorkspaceMobile(context, user, groups, subscription, activeContext);
    }
    return _buildWorkspaceDesktop(context, user, groups, documents, extractJobs, subscription, result, activeContext, roadmap, architectureTargets);
  }

  Widget _buildWorkspaceMobile(
    BuildContext context,
    AppUser user,
    List<ProjectGroup> groups,
    SubscriptionOverview subscription,
    ActiveContext activeContext,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 品牌头部
          _buildHeroSection(context, user, subscription, compact: true),
          const SizedBox(height: 16),
          // 四个功能卡片 2x2
          _buildFeatureCards(context, compact: true),
          const SizedBox(height: 20),
          // 大输入框
          _buildMainSearchBox(context, activeContext, compact: true),
          const SizedBox(height: 20),
          // 项目信息
          _buildSidePanel(context, groups, subscription, compact: true),
        ],
      ),
    );
  }

  Widget _buildWorkspaceDesktop(
    BuildContext context,
    AppUser user,
    List<ProjectGroup> groups,
    List<KnowledgeDocument> documents,
    List<ExtractionJob> extractJobs,
    SubscriptionOverview subscription,
    QueryResult result,
    ActiveContext activeContext,
    List<RoadmapItem> roadmap,
    ArchitectureTargets architectureTargets,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 7,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 24, 12, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeroSection(context, user, subscription, compact: false),
                const SizedBox(height: 20),
                _buildFeatureCards(context, compact: false),
                const SizedBox(height: 20),
                _buildMainSearchBox(context, activeContext, compact: false),
                const SizedBox(height: 24),
                _buildDocumentPanel(documents, extractJobs),
              ],
            ),
          ),
        ),
        SizedBox(
          width: 300,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(12, 24, 24, 24),
            child: _buildSidePanel(context, groups, subscription, compact: false),
          ),
        ),
      ],
    );
  }

  Widget _buildHeroSection(
    BuildContext context,
    AppUser user,
    SubscriptionOverview subscription, {
    required bool compact,
  }) {
    final theme = Theme.of(context);
    final statusText = _isAdmin
        ? '管理员 · 公共库管理视角'
        : () {
            final s = subscription;
            if (s.effectiveOrder != null) return '${s.effectiveOrder!.planLabel} · 到期：${s.effectiveOrder!.expiredAt}';
            if (s.planId == 'expired' || s.statusLabel.contains('已过期')) return '试用已结束，请订阅以继续使用';
            return '试用到期：${s.trialEndsAt} · 全功能试用 ${s.trialDays} 天';
          }();

    return Container(
      padding: EdgeInsets.all(compact ? 16 : 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary, theme.colorScheme.primary.withValues(alpha: 0.75)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '小嘉审计助手',
                  style: theme.textTheme.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.w700, fontSize: compact ? 18 : 22),
                ),
                const SizedBox(height: 2),
                Text(
                  'AI 审计工作台',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.75), letterSpacing: 0.5),
                ),
                const SizedBox(height: 8),
                Text(
                  '你好，${user.name} · $statusText',
                  style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                ),
              ],
            ),
          ),
          Icon(Icons.balance_outlined, color: Colors.white.withValues(alpha: 0.5), size: compact ? 32 : 40),
        ],
      ),
    );
  }

  Widget _buildMainSearchBox(BuildContext context, ActiveContext activeContext, {required bool compact}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: _questionController,
          maxLines: compact ? 4 : 5,
          decoration: InputDecoration(
            hintText: '请输入审计问题，例如：学校食堂采购有哪些风险？',
            alignLabelWithHint: true,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            filled: true,
          ),
        ),
        const SizedBox(height: 10),
        if (!_isAdmin && _hasReachedDailyQueryLimit)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              '今日查询额度已用尽（${_overview?.subscription.dailyQueriesLimit ?? 0} 次/天）',
              style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12),
            ),
          ),
        FilledButton.icon(
          onPressed: _searching || _switchingGroup || (!_isAdmin && _hasReachedDailyQueryLimit) ? null : _runSearch,
          icon: _searching
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.search),
          label: Text(_searching ? '检索中…' : '开始审计问答'),
          style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 13)),
        ],
        if (_result != null) ...[
          const SizedBox(height: 16),
          _buildQueryResult(context, _result!),
        ],
      ],
    );
  }

  Widget _buildQueryResult(BuildContext context, QueryResult result) {
    final theme = Theme.of(context);

    if (result.answer.isEmpty && result.citations.isEmpty && result.similarCases.isEmpty && result.riskTable == null) {
      return const SizedBox.shrink();
    }

    if (result.riskTable != null && result.riskTable!.rows.isNotEmpty) {
      return _buildRiskTableResult(context, result);
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: Container(
                  constraints: const BoxConstraints(maxHeight: 400),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(12),
                    child: Text(result.answer, style: const TextStyle(fontSize: 14)),
                  ),
                ),
              ),
              if (result.similarCases.isNotEmpty) ...[
                const SizedBox(width: 16),
                Expanded(
                  flex: 1,
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 400),
                    decoration: BoxDecoration(
                      border: Border.all(color: theme.colorScheme.outlineVariant),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text('相关审计案例（${result.similarCases.length}）', style: theme.textTheme.labelMedium),
                        ),
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Column(
                              children: result.similarCases.map((c) {
                                final parsed = _parseCaseChunk(c.matchedChunk);
                                final description = parsed['description'] ?? '';
                                final basis = parsed['basis'] ?? '';
                                final problemType = parsed['problemType'] ?? '';

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  child: ListTile(
                                    dense: true,
                                    enabled: c.documentId.isNotEmpty,
                                    onTap: c.documentId.isEmpty ? null : () => _showCaseDetailDialog(c),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                    title: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                    subtitle: Text(
                                      [
                                        if (problemType.isNotEmpty) '问题类型：$problemType',
                                        if (description.isNotEmpty) '问题描述：$description',
                                        if (basis.isNotEmpty) '定性依据：$basis',
                                      ].join('\n'),
                                      maxLines: 4,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('${(c.score * 100).toStringAsFixed(0)}%', style: TextStyle(color: theme.colorScheme.secondary, fontSize: 12)),
                                        const SizedBox(width: 6),
                                        Icon(Icons.open_in_new, size: 16, color: theme.colorScheme.outline),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (result.citations.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('参考来源（${result.citations.length}）', style: theme.textTheme.labelMedium),
            const SizedBox(height: 6),
            Container(
              constraints: const BoxConstraints(maxHeight: 400),
              child: SingleChildScrollView(
                child: Column(
                  children: result.citations.map((c) => Card(
                    margin: const EdgeInsets.only(bottom: 6),
                    child: ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      title: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      subtitle: Text(
                        '${c.libraryType}${c.chapterTitle.isNotEmpty ? ' · ${c.chapterTitle}' : ''}${c.articleRef.isNotEmpty ? ' ${c.articleRef}' : ''}\n${c.matchedChunk}',
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Text('${(c.score * 100).toStringAsFixed(0)}%', style: TextStyle(color: theme.colorScheme.primary, fontSize: 12)),
                    ),
                  )).toList(),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRiskTableResult(BuildContext context, QueryResult result) {
    final theme = Theme.of(context);
    final table = result.riskTable!;

    Widget buildListSection(String title, List<String> items) {
      if (items.isEmpty) return const SizedBox.shrink();
      return Padding(
        padding: const EdgeInsets.only(top: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            ...items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Text('• $item', style: const TextStyle(fontSize: 13)),
            )),
          ],
        ),
      );
    }

    Color riskBg(String level) {
      switch (level) {
        case '高':
          return const Color(0xFFFEE2E2);
        case '中':
          return const Color(0xFFFEF3C7);
        default:
          return const Color(0xFFDCFCE7);
      }
    }

    Color riskFg(String level) {
      switch (level) {
        case '高':
          return const Color(0xFFB91C1C);
        case '中':
          return const Color(0xFFB45309);
        default:
          return const Color(0xFF15803D);
      }
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (table.summary.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(table.summary, style: const TextStyle(fontSize: 14)),
            ),
            const SizedBox(height: 12),
          ],
          Container(
            constraints: const BoxConstraints(maxHeight: 400),
            child: SingleChildScrollView(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
              columnSpacing: 16,
              headingRowHeight: 42,
              dataRowMinHeight: 52,
              dataRowMaxHeight: 70,
              columns: const [
                DataColumn(label: Text('序号')),
                DataColumn(label: Text('风险点')),
                DataColumn(label: Text('检查内容')),
                DataColumn(label: Text('法规依据')),
                DataColumn(label: Text('案例参考')),
                DataColumn(label: Text('取证资料')),
                DataColumn(label: Text('风险等级')),
                DataColumn(label: Text('详情')),
              ],
              rows: table.rows.map((row) {
                return DataRow(
                  cells: [
                    DataCell(Text('${row.index}')),
                    DataCell(SizedBox(width: 140, child: Text(row.riskPoint, maxLines: 2, overflow: TextOverflow.ellipsis))),
                    DataCell(SizedBox(width: 220, child: Text(row.checkContent, maxLines: 3, overflow: TextOverflow.ellipsis))),
                    DataCell(SizedBox(width: 180, child: Text(row.legalBasis, maxLines: 2, overflow: TextOverflow.ellipsis))),
                    DataCell(SizedBox(width: 160, child: Text(row.caseReference, maxLines: 2, overflow: TextOverflow.ellipsis))),
                    DataCell(SizedBox(width: 180, child: Text(row.evidenceMaterials, maxLines: 2, overflow: TextOverflow.ellipsis))),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: riskBg(row.riskLevel),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          row.riskLevel,
                          style: TextStyle(color: riskFg(row.riskLevel), fontWeight: FontWeight.w600, fontSize: 12),
                        ),
                      ),
                    ),
                    DataCell(
                      TextButton(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: Text('${row.index}. ${row.riskPoint}'),
                              content: SizedBox(
                                width: 680,
                                child: SingleChildScrollView(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (row.detail.explanation.isNotEmpty) Text(row.detail.explanation),
                                      buildListSection('相关法条', row.detail.legalBasisDetails),
                                      buildListSection('相关案例', row.detail.caseDetails),
                                      buildListSection('审计取证建议', row.detail.evidenceSuggestions),
                                      buildListSection('可能问题定性', row.detail.possibleFindings),
                                      buildListSection('整改建议', row.detail.rectificationSuggestions),
                                    ],
                                  ),
                                ),
                              ),
                              actions: [
                                TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('关闭')),
                              ],
                            ),
                          );
                        },
                        child: const Text('展开'),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
            ),
          ),
          if (result.citations.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('参考来源（${result.citations.length}）', style: theme.textTheme.labelMedium),
            const SizedBox(height: 6),
            Container(
              constraints: const BoxConstraints(maxHeight: 400),
              child: SingleChildScrollView(
                child: Column(
                  children: result.citations.map((c) => Card(
                    margin: const EdgeInsets.only(bottom: 6),
                    child: ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      title: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      subtitle: Text(
                        '${c.libraryType}${c.chapterTitle.isNotEmpty ? ' · ${c.chapterTitle}' : ''}${c.articleRef.isNotEmpty ? ' ${c.articleRef}' : ''}\n${c.matchedChunk}',
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Text('${(c.score * 100).toStringAsFixed(0)}%', style: TextStyle(color: theme.colorScheme.primary, fontSize: 12)),
                    ),
                  )).toList(),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFeatureCards(BuildContext context, {required bool compact}) {
    final cards = [
      _FeatureCardData(icon: Icons.gavel_outlined, color: const Color(0xFF1D4ED8), title: '法条查询', subtitle: '国家法律与政策文件', queryScope: 'regulation'),
      _FeatureCardData(icon: Icons.library_books_outlined, color: const Color(0xFF0891B2), title: '资料库问答', subtitle: '自建/购买资料智能问答', queryScope: 'material'),
      _FeatureCardData(icon: Icons.cases_outlined, color: const Color(0xFF7C3AED), title: '案例参考', subtitle: '全国/地方审计案例', queryScope: 'case'),
      _FeatureCardData(icon: Icons.checklist_outlined, color: const Color(0xFF059669), title: '风险排查', subtitle: '结合法条案例生成检查点', queryScope: 'risk'),
    ];

    if (compact) {
      return GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.6,
        children: cards.map((c) => _buildFeatureCard(context, c)).toList(),
      );
    }

    return Row(
      children: cards
          .map((c) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 12), child: _buildFeatureCard(context, c))))
          .toList(),
    );
  }

  Widget _buildFeatureCard(BuildContext context, _FeatureCardData data) {
    return InkWell(
      onTap: () {
        setState(() => _queryScope = data.queryScope);
        _questionController.text = '请检索与${data.title}相关的内容。';
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: data.color.withValues(alpha: 0.06),
          border: Border.all(color: data.color.withValues(alpha: 0.2)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(data.icon, color: data.color, size: 22),
            const SizedBox(height: 6),
            Text(data.title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: data.color)),
            const SizedBox(height: 2),
            Text(data.subtitle, style: TextStyle(fontSize: 11, color: data.color.withValues(alpha: 0.7))),
          ],
        ),
      ),
    );
  }

  Widget _buildSidePanel(BuildContext context, List<ProjectGroup> groups, SubscriptionOverview subscription, {required bool compact}) {
    final theme = Theme.of(context);
    final recentEvents = _overview?.recentAuditEvents ?? const [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 项目组选择
        if (!_isAdmin) ...[
          SectionCard(
            title: '当前项目组',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _selectedGroupId,
                  decoration: const InputDecoration(labelText: '选择项目组', isDense: true),
                  items: groups
                      .map((g) => DropdownMenuItem(value: g.id, child: Text(g.name, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: _switchingGroup ? null : _switchGroup,
                ),
                if (_switchingGroup) ...[
                  const SizedBox(height: 8),
                  const LinearProgressIndicator(),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        // 额度
        SectionCard(
          title: '使用额度',
          child: Column(
            children: [
              _buildQuotaRow(context, '项目组', subscription.groupsUsed, subscription.groupsLimit),
              const SizedBox(height: 8),
              _buildQuotaRow(context, '私有文件', subscription.privateDocumentsUsed, subscription.privateDocumentsLimit),
              const SizedBox(height: 8),
              _buildQuotaRow(context, '今日查询', subscription.dailyQueriesUsed, subscription.dailyQueriesLimit),
              const SizedBox(height: 10),
              OutlinedButton(
                onPressed: () => setState(() => _selectedIndex = _isAdmin ? 1 : 2),
                style: OutlinedButton.styleFrom(visualDensity: VisualDensity.compact),
                child: Text('${subscription.planName} · 查看套餐', style: const TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // 检索历史
        if (_queryHistory.isNotEmpty)
          SectionCard(
            title: '检索历史',
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 200),
              child: SingleChildScrollView(
                child: Column(
                  children: _queryHistory.map((h) {
                    try {
                      final timestamp = DateTime.parse(h['queriedAt'] as String);
                      final timeStr = '${timestamp.month}/${timestamp.day} ${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
                      return InkWell(
                        onTap: () {
                          _questionController.text = h['queryText'] as String;
                          if (h['queryResult'] != null) {
                            try {
                              final result = QueryResult.fromJson(h['queryResult'] as Map<String, dynamic>);
                              setState(() {
                                _result = result;
                                _error = null;
                              });
                            } catch (e, stackTrace) {
                              _runSearch();
                            }
                          } else {
                            _runSearch();
                          }
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              if (h['queryScope'] != null) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: _getScopeColor(h['queryScope'] as String).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    _getScopeLabel(h['queryScope'] as String),
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: _getScopeColor(h['queryScope'] as String),
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                              ],
                              Icon(Icons.search, size: 14, color: theme.colorScheme.outline),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  '${h['queryText']} · $timeStr',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    } catch (e) {
                      return const SizedBox.shrink();
                    }
                  }).toList(),
                ),
              ),
            ),
          ),
        const SizedBox(height: 12),
        // 最近操作
        if (recentEvents.isNotEmpty)
          SectionCard(
            title: '最近操作',
            child: Column(
              children: recentEvents.take(5).map((e) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Icon(Icons.history, size: 14, color: theme.colorScheme.outline),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${e.actorName} · ${e.summary}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildQuotaRow(BuildContext context, String label, int used, int limit) {
    final theme = Theme.of(context);
    final ratio = limit > 0 ? (used / limit).clamp(0.0, 1.0) : 0.0;
    final nearLimit = ratio >= 0.8;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: theme.textTheme.bodySmall),
            Text(limit > 0 ? '$used / $limit' : '不限', style: theme.textTheme.bodySmall?.copyWith(color: nearLimit ? theme.colorScheme.error : null)),
          ],
        ),
        const SizedBox(height: 4),
        if (limit > 0)
          LinearProgressIndicator(
            value: ratio,
            color: nearLimit ? theme.colorScheme.error : theme.colorScheme.primary,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
            minHeight: 4,
            borderRadius: BorderRadius.circular(2),
          ),
      ],
    );
  }

  Widget _buildGroupPanel(List<ProjectGroup> groups) {
    return SectionCard(
      title: '项目组',
      subtitle: '支持创建、邀请、组长清退组员、成员自行退出、移交组长。',
      action: Wrap(
        spacing: 8,
        children: [
          FilledButton(onPressed: _activeGroupId == null ? null : _showInviteDialog, child: const Text('邀请成员')),
          FilledButton(onPressed: _hasReachedGroupLimit ? null : _showCreateGroupDialog, child: const Text('创建项目组')),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (groups.isEmpty)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFD9E3F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('你当前还没有可用项目组。', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text(
                    '可以先创建一个新项目组，或等待组长邀请你加入其他项目组。',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _hasReachedGroupLimit ? null : _showCreateGroupDialog,
                    child: const Text('立即创建项目组'),
                  ),
                ],
              ),
            ),
          if (_activeGroupId == null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                groups.isEmpty ? '当前没有已选项目组，成员邀请、组长移交与群聊协作将保持禁用。' : '当前未选择项目组，成员邀请、组长移交与群聊协作将保持禁用。',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          if (!_isAdmin && _hasReachedGroupLimit)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                '当前套餐仅支持 ${_overview?.subscription.groupsLimit ?? 0} 个项目组，已达到创建上限。',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ...groups.map(
            (group) => ListTile(
              contentPadding: EdgeInsets.zero,
              selected: group.id == _selectedGroupId,
              onTap: () => _switchGroup(group.id),
              title: Text(group.name),
              subtitle: Text('${group.organizationName} · 成员 ${group.memberCount} 人 · 私有文件 ${group.privateDocumentCount} 个'),
              trailing: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                children: [
                  Text(group.lastQueryAt),
                  if (group.id == _selectedGroupId && _isCurrentUserLeader)
                    TextButton(
                      onPressed: _switchingGroup ? null : () => _deleteGroup(group),
                      child: const Text('删除'),
                    ),
                ],
              ),
            ),
          ),
          if (_activeGroupId != null) ...[
            const Divider(height: 24),
            Row(
              children: [
                Text('成员列表', style: Theme.of(context).textTheme.titleSmall),
                const Spacer(),
                TextButton(onPressed: _activeGroupId == null || _membersLoading ? null : _refreshMembers, child: const Text('刷新成员')),
                if (_isCurrentUserLeader)
                  TextButton(onPressed: _activeGroupId == null ? null : _showTransferLeaderDialog, child: const Text('移交组长')),
              ],
            ),
            if (_membersLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: LinearProgressIndicator(),
              ),
            ..._members.map(
              (member) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(member.name),
                subtitle: Text('${member.phone} · ${member.role}'),
                onTap: () => _showMemberInfoDialog(member),
                trailing: member.role == '组长'
                    ? const Text('当前组长')
                    : member.userId == widget.currentUser.id
                        ? TextButton(
                            onPressed: _membersLoading ? null : () => _removeMember(member),
                            child: const Text('退出'),
                          )
                        : _isCurrentUserLeader
                            ? TextButton(
                                onPressed: _membersLoading ? null : () => _removeMember(member),
                                child: const Text('清退'),
                              )
                            : null,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDocumentPanel(List<KnowledgeDocument> documents, List<ExtractionJob> extractJobs) {
    return SectionCard(
      title: '知识库管理',
      subtitle: _isAdmin ? '管理员仅管理公共库资料，导入后进入文字抽取、结构化切分与向量化入库链路。' : '导入后进入文字抽取、结构化切分与向量化入库链路。',
      action: Wrap(
        spacing: 8,
        children: [
          FilledButton(onPressed: _documentsLoading ? null : _refreshDocuments, child: const Text('刷新任务')),
          FilledButton(
            onPressed: (_isCurrentUserLeader || _canImportPublicDocuments) && !(_hasReachedPrivateDocumentLimit && _activeGroupId != null)
                ? _showImportDocumentDialog
                : null,
            child: const Text('导入文件'),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_activeGroupId == null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                _isAdmin
                    ? '当前为管理员视角，仅管理公共库资料，不加入项目组。'
                    : _canImportPublicDocuments
                        ? '当前未选择项目组，可导入公共库资料；如需导入私有资料，请先进入项目组。'
                        : '当前未选择项目组，公共库仅允许管理员导入；如需导入私有资料，请先进入项目组。',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          if (!_isAdmin && _hasReachedPrivateDocumentLimit)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                '当前套餐仅支持 ${_overview?.subscription.privateDocumentsLimit ?? 0} 个私有库文件，已达到导入上限。',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          if (_documentsLoading)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: LinearProgressIndicator(),
            ),
          SizedBox(
            height: 300,
            child: SingleChildScrollView(
              child: Column(
                children: documents.map(
                  (document) => ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                    title: Text(document.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${document.uploadedAt} · ${document.libraryType}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        TextButton(
                          onPressed: () => _showDocumentChunksDialog(document),
                          child: const Text('查看文本块'),
                        ),
                        if ((document.libraryType != '私有库' && _isAdmin) ||
                            (document.libraryType == '私有库' && _isCurrentUserLeader))
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 20),
                            tooltip: '删除',
                            onPressed: () => _deleteDocument(document),
                          ),
                      ],
                    ),
                  ),
                ).toList(),
              ),
            ),
          ),
          const Divider(height: 24),
          Text('抽取任务', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          Text(
            '当前任务状态用于展示目标 RAG 入库流水线，后续可替换为真实 OCR、切分与向量化任务。',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 200,
            child: SingleChildScrollView(
              child: Column(
                children: extractJobs.map(
                  (job) {
                    final doc = documents.where((d) => d.id == job.documentId).firstOrNull;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(doc?.title ?? job.documentId),
                      subtitle: Text('${job.stage} · ${job.startedAt}'),
                      trailing: Text('${job.progress}%'),
                    );
                  },
                ).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChat() {
    final activeConversation = _selectedConversation;
    final visibleConversations = _visibleConversations;

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 960;
        final groupPanel = _buildGroupPanel(_overview?.groups ?? const []);
        final conversationList = SectionCard(
          title: '对话列表',
          subtitle: _activeGroupId == null
              ? '请先在上方项目组面板中创建或选择项目组。'
              : _overview?.activeTeamAgent == null
              ? '已按当前项目组上下文刷新会话与消息。'
              : '已按当前项目组 Agent 优先展示会话与消息。',
          child: SizedBox(
            height: compact ? 320 : 560,
            child: Column(
              children: [
                TextField(
                  controller: _conversationSearchController,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    hintText: '搜索会话标题或最后消息',
                    prefixIcon: Icon(Icons.search),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: _conversations.isEmpty
                      ? Center(
                          child: Text(
                            '暂无会话',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        )
                      : visibleConversations.isEmpty
                          ? Center(
                              child: Text(
                                '没有匹配的会话。',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            )
                          : ListView(
                              children: visibleConversations
                                  .map(
                                    (item) => ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      selected: item.id == _selectedConversationId,
                                      onTap: () => _loadConversationMessages(item.id),
                                      leading: CircleAvatar(child: Text(item.isTeamAgent ? '智' : item.type == '群聊' ? '群' : '私')),
                                      title: Row(
                                        children: [
                                          Expanded(child: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
                                          if (_pinnedConversationIds.contains(item.id)) ...[
                                            const SizedBox(width: 8),
                                            const Icon(Icons.push_pin, size: 16, color: Color(0xFF1D4ED8)),
                                          ],
                                          if (item.unreadCount > 0) ...[
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFD92D20),
                                                borderRadius: BorderRadius.circular(999),
                                              ),
                                              child: Text(
                                                item.unreadCount > 99 ? '99+' : '${item.unreadCount}',
                                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                                              ),
                                            ),
                                          ],
                                          const SizedBox(width: 8),
                                          IconButton(
                                            tooltip: _mutedConversationIds.contains(item.id) ? '取消静音' : '静音会话',
                                            onPressed: () => _toggleMutedConversation(item.id),
                                            icon: Icon(
                                              _mutedConversationIds.contains(item.id) ? Icons.notifications_off : Icons.notifications_off_outlined,
                                              size: 18,
                                              color: _mutedConversationIds.contains(item.id) ? const Color(0xFF667085) : null,
                                            ),
                                          ),
                                          IconButton(
                                            tooltip: _pinnedConversationIds.contains(item.id) ? '取消置顶' : '置顶会话',
                                            onPressed: () => _togglePinnedConversation(item.id),
                                            icon: Icon(
                                              _pinnedConversationIds.contains(item.id) ? Icons.push_pin : Icons.push_pin_outlined,
                                              size: 18,
                                              color: _pinnedConversationIds.contains(item.id) ? const Color(0xFF1D4ED8) : null,
                                            ),
                                          ),
                                        ],
                                      ),
                                      subtitle: Text(
                                        item.lastMessage,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontWeight: item.unreadCount > 0 ? FontWeight.w600 : FontWeight.w400,
                                        ),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                ),
              ],
            ),
          ),
        );

        final visibleMessages = _visibleMessages;
        final messagePanel = SectionCard(
          title: activeConversation?.title ?? '消息详情',
          subtitle: _activeGroupId == null ? '请先在上方项目组面板中创建或选择项目组。' : activeConversation == null ? '请选择一个会话。' : '支持读取和发送消息。',
          action: activeConversation == null
              ? null
              : Wrap(
                  spacing: 8,
                  children: [
                    if (_firstUnreadMessageIndex >= 0)
                      TextButton(
                        onPressed: _jumpToFirstUnreadMessage,
                        child: const Text('定位未读'),
                      ),
                    TextButton(
                      onPressed: _clearConversationMessages,
                      child: const Text('清空会话'),
                    ),
                    if (activeConversation.type == '私信')
                      TextButton(
                        onPressed: _deleteSelectedDirectConversation,
                        child: const Text('删除私聊'),
                      ),
                  ],
                ),
          child: SizedBox(
            height: compact ? 420 : 560,
            child: Column(
              children: [
                if (activeConversation != null) ...[
                  TextField(
                    controller: _messageSearchController,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(
                      hintText: '搜索消息内容或文件名',
                      prefixIcon: Icon(Icons.search),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                Expanded(
                  child: _chatLoading
                      ? const Center(child: CircularProgressIndicator())
                      : _activeGroupId == null
                          ? Center(
                              child: Text(
                                '请先创建或选择项目组。',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            )
                          : _messages.isEmpty
                              ? Center(
                                  child: Text(
                                    activeConversation == null ? '请选择一个会话。' : '当前暂无消息。',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                )
                          : visibleMessages.isEmpty
                              ? Center(
                                  child: Text(
                                    '没有匹配的消息。',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                )
                          : ListView(
                              controller: _messagesScrollController,
                              children: [
                                ...visibleMessages
                                    .asMap()
                                    .entries
                                    .map(
                                    (entry) {
                                      final index = entry.key;
                                      final message = entry.value;
                                      final isCurrentUser = message.senderName == widget.currentUser.name;
                                      final showSender = _shouldShowSender(index);
                                      final showTimestamp = _shouldShowTimestamp(index);
                                      final showDayDivider = _shouldShowDayDivider(index);
                                      final isFirstUnread = index == _firstUnreadMessageIndex;
                                      if (message.messageType == 'system') {
                                        return Column(
                                          children: [
                                            if (showDayDivider)
                                              Container(
                                                margin: const EdgeInsets.only(bottom: 12),
                                                child: Row(
                                                  children: [
                                                    const Expanded(child: Divider()),
                                                    Padding(
                                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                                      child: Text(_messageDayLabel(message.sentAt), style: Theme.of(context).textTheme.bodySmall),
                                                    ),
                                                    const Expanded(child: Divider()),
                                                  ],
                                                ),
                                              ),
                                            if (isFirstUnread)
                                              Container(
                                                margin: const EdgeInsets.only(bottom: 12),
                                                child: Row(
                                                  children: [
                                                    const Expanded(child: Divider()),
                                                    Padding(
                                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                                      child: Text('以下为未读消息', style: Theme.of(context).textTheme.bodySmall),
                                                    ),
                                                    const Expanded(child: Divider()),
                                                  ],
                                                ),
                                              ),
                                            Center(
                                              child: Container(
                                                margin: const EdgeInsets.only(bottom: 12),
                                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF2F4F7),
                                                  borderRadius: BorderRadius.circular(999),
                                                ),
                                                child: Text(
                                                  message.content,
                                                  style: Theme.of(context).textTheme.bodySmall,
                                                ),
                                              ),
                                            ),
                                          ],
                                        );
                                      }
                                      return Column(
                                        children: [
                                          if (isFirstUnread)
                                            Container(
                                              margin: const EdgeInsets.only(bottom: 12),
                                              child: Row(
                                                children: [
                                                  const Expanded(child: Divider()),
                                                  Padding(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12),
                                                    child: Text('以下为未读消息', style: Theme.of(context).textTheme.bodySmall),
                                                  ),
                                                  const Expanded(child: Divider()),
                                                ],
                                              ),
                                            ),
                                          Align(
                                            alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
                                            child: Container(
                                          margin: const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.all(12),
                                          constraints: const BoxConstraints(maxWidth: 420),
                                          decoration: BoxDecoration(
                                            color: isCurrentUser
                                                ? Theme.of(context).colorScheme.primaryContainer
                                                : Theme.of(context).colorScheme.surfaceContainerLowest,
                                            borderRadius: BorderRadius.circular(14),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              if (showSender) ...[
                                                Row(
                                                  children: [
                                                    Expanded(
                                                      child: Text(message.senderName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                                    ),
                                                    if (isCurrentUser)
                                                      Wrap(
                                                        spacing: 8,
                                                        children: [
                                                          TextButton.icon(
                                                            onPressed: () => _recallMessage(message),
                                                            icon: const Icon(Icons.undo_outlined, size: 16),
                                                            label: const Text('撤回'),
                                                          ),
                                                          TextButton.icon(
                                                            onPressed: () => _deleteMessage(message),
                                                            icon: const Icon(Icons.delete_outline, size: 16),
                                                            label: const Text('删除'),
                                                          ),
                                                        ],
                                                      ),
                                                  ],
                                                ),
                                                const SizedBox(height: 6),
                                              ] else if (isCurrentUser) ...[
                                                Align(
                                                  alignment: Alignment.centerRight,
                                                  child: Wrap(
                                                    spacing: 8,
                                                    children: [
                                                      TextButton.icon(
                                                        onPressed: () => _recallMessage(message),
                                                        icon: const Icon(Icons.undo_outlined, size: 16),
                                                        label: const Text('撤回'),
                                                      ),
                                                      TextButton.icon(
                                                        onPressed: () => _deleteMessage(message),
                                                        icon: const Icon(Icons.delete_outline, size: 16),
                                                        label: const Text('删除'),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                const SizedBox(height: 6),
                                              ],
                                              if (message.messageType == 'file' && message.file != null) ...[
                                                Align(
                                                  alignment: Alignment.centerRight,
                                                  child: Wrap(
                                                    spacing: 8,
                                                    runSpacing: 8,
                                                    children: [
                                                      if (message.content.isNotEmpty && message.content != message.file!.name)
                                                        TextButton.icon(
                                                          onPressed: () => _copyMessageContent(message.content),
                                                          icon: const Icon(Icons.content_copy_outlined, size: 16),
                                                          label: const Text('复制附言'),
                                                        ),
                                                      TextButton.icon(
                                                        onPressed: () => _copyAttachmentPath(message.file!),
                                                        icon: const Icon(Icons.link_outlined, size: 16),
                                                        label: const Text('复制路径'),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                const SizedBox(height: 6),
                                                InkWell(
                                                  onTap: _isImageAttachment(message.file!.extension, message.file!.mimeType)
                                                      ? () => _handleAttachmentTap(message.file!)
                                                      : null,
                                                  borderRadius: BorderRadius.circular(10),
                                                  child: Container(
                                                    width: double.infinity,
                                                    padding: const EdgeInsets.all(10),
                                                    decoration: BoxDecoration(
                                                      color: Colors.white.withValues(alpha: 0.72),
                                                      borderRadius: BorderRadius.circular(10),
                                                      border: Border.all(
                                                        color: _attachmentAccentColor(message.file!.extension, message.file!.mimeType).withValues(alpha: 0.28),
                                                      ),
                                                    ),
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        if (_isImageAttachment(message.file!.extension, message.file!.mimeType)) ...[
                                                          ClipRRect(
                                                            borderRadius: BorderRadius.circular(8),
                                                            child: AspectRatio(
                                                              aspectRatio: 16 / 9,
                                                              child: Image.network(
                                                                widget.apiService.buildFileUri(message.file!.path).toString(),
                                                                fit: BoxFit.cover,
                                                                errorBuilder: (context, error, stackTrace) {
                                                                  return Container(
                                                                    color: Theme.of(context).colorScheme.surfaceContainerLowest,
                                                                    alignment: Alignment.center,
                                                                    child: const Icon(Icons.broken_image_outlined),
                                                                  );
                                                                },
                                                              ),
                                                            ),
                                                          ),
                                                          const SizedBox(height: 10),
                                                        ],
                                                        Row(
                                                          children: [
                                                            Container(
                                                              padding: const EdgeInsets.all(8),
                                                              decoration: BoxDecoration(
                                                                color: _attachmentAccentColor(message.file!.extension, message.file!.mimeType).withValues(alpha: 0.12),
                                                                borderRadius: BorderRadius.circular(10),
                                                              ),
                                                              child: Icon(
                                                                _attachmentIcon(message.file!.extension, message.file!.mimeType),
                                                                size: 18,
                                                                color: _attachmentAccentColor(message.file!.extension, message.file!.mimeType),
                                                              ),
                                                            ),
                                                            const SizedBox(width: 8),
                                                            Expanded(
                                                              child: Column(
                                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                                children: [
                                                                  InkWell(
                                                                    onTap: () => _downloadChatAttachment(messageId: message.id, attachment: message.file!),
                                                                    child: Text(
                                                                      message.file!.name,
                                                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                                                    ),
                                                                  ),
                                                                  const SizedBox(height: 4),
                                                                  Wrap(
                                                                    spacing: 6,
                                                                    runSpacing: 6,
                                                                    children: [
                                                                      Container(
                                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                                        decoration: BoxDecoration(
                                                                          color: _attachmentAccentColor(message.file!.extension, message.file!.mimeType).withValues(alpha: 0.12),
                                                                          borderRadius: BorderRadius.circular(999),
                                                                        ),
                                                                        child: Text(
                                                                          _attachmentTypeLabel(message.file!.extension, message.file!.mimeType),
                                                                          style: TextStyle(
                                                                            color: _attachmentAccentColor(message.file!.extension, message.file!.mimeType),
                                                                            fontSize: 12,
                                                                            fontWeight: FontWeight.w600,
                                                                          ),
                                                                        ),
                                                                      ),
                                                                      Text(
                                                                        '${message.file!.extension.toUpperCase()} · ${_formatFileSize(message.file!.size)}',
                                                                        style: Theme.of(context).textTheme.bodySmall,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ],
                                                              ),
                                                            ),
                                                            const SizedBox(width: 8),
                                                            Icon(
                                                              _isImageAttachment(message.file!.extension, message.file!.mimeType)
                                                                  ? Icons.zoom_in_outlined
                                                                  : Icons.open_in_new,
                                                              size: 16,
                                                              color: _attachmentAccentColor(message.file!.extension, message.file!.mimeType),
                                                            ),
                                                          ],
                                                        ),
                                                        const SizedBox(height: 6),
                                                        Text(
                                                          _isImageAttachment(message.file!.extension, message.file!.mimeType) ? '点击图片预览，点击文件名下载并打开' : '仅文件名可点击：下载并打开',
                                                          style: Theme.of(context).textTheme.bodySmall,
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                                if (message.content.isNotEmpty && message.content != message.file!.name) ...[
                                                  const SizedBox(height: 8),
                                                  Text(message.content),
                                                ],
                                              ] else ...[
                                                if (message.content.isNotEmpty)
                                                  Align(
                                                    alignment: Alignment.centerRight,
                                                    child: TextButton.icon(
                                                      onPressed: () => _copyMessageContent(message.content),
                                                      icon: const Icon(Icons.content_copy_outlined, size: 16),
                                                      label: const Text('复制消息'),
                                                    ),
                                                  ),
                                                if (message.content.isNotEmpty) const SizedBox(height: 6),
                                                Text(message.content),
                                              ],
                                              if (showTimestamp) ...[
                                                const SizedBox(height: 6),
                                                Text(message.sentAt, style: Theme.of(context).textTheme.bodySmall),
                                              ],
                                            ],
                                          ),
                                        ),
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ..._pendingMessages.map(
                                  (pending) => Align(
                                    alignment: Alignment.centerRight,
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      padding: const EdgeInsets.all(12),
                                      constraints: const BoxConstraints(maxWidth: 420),
                                      decoration: BoxDecoration(
                                        color: pending.status == _PendingChatMessageStatus.failed
                                            ? Theme.of(context).colorScheme.errorContainer
                                            : Theme.of(context).colorScheme.primaryContainer,
                                        borderRadius: BorderRadius.circular(14),
                                        border: pending.status == _PendingChatMessageStatus.failed
                                            ? Border.all(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.4))
                                            : null,
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('我', style: TextStyle(fontWeight: FontWeight.w600)),
                                          const SizedBox(height: 6),
                                          if (pending.file != null)
                                            Container(
                                              width: double.infinity,
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: Colors.white.withValues(alpha: 0.72),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                children: [
                                                  Icon(_attachmentIcon(pending.file!.extension ?? '', '')),
                                                  const SizedBox(width: 8),
                                                  Expanded(
                                                    child: Text(
                                                      pending.file!.name,
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                      style: const TextStyle(fontWeight: FontWeight.w600),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          if (pending.file != null && pending.content.isNotEmpty)
                                            const SizedBox(height: 8),
                                          if (pending.content.isNotEmpty) Text(pending.content),
                                          const SizedBox(height: 6),
                                          if (pending.file != null && pending.status != _PendingChatMessageStatus.failed) ...[
                                            LinearProgressIndicator(value: pending.progress <= 0 ? null : pending.progress),
                                            const SizedBox(height: 6),
                                          ],
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  pending.status == _PendingChatMessageStatus.failed
                                                      ? (pending.error ?? '发送失败')
                                                      : pending.file == null
                                                          ? '发送中...'
                                                          : '上传中... ${(pending.progress * 100).clamp(0, 100).round()}%',
                                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                        color: pending.status == _PendingChatMessageStatus.failed
                                                            ? const Color(0xFFB42318)
                                                            : null,
                                                      ),
                                                ),
                                              ),
                                              if (pending.status == _PendingChatMessageStatus.failed)
                                                TextButton(
                                                  onPressed: () => _retryPendingMessage(pending.id),
                                                  child: const Text('重试'),
                                                )
                                              else
                                                const SizedBox(
                                                  height: 16,
                                                  width: 16,
                                                  child: CircularProgressIndicator(strokeWidth: 2),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                ),
                const SizedBox(height: 12),
                if (_selectedMessageFiles.isNotEmpty)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF7F7FA),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE0E3EA)),
                    ),
                    child: AnimatedOpacity(
                      duration: const Duration(milliseconds: 160),
                      opacity: _sendingMessage ? 0.6 : 1,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('已选择 ${_selectedMessageFiles.length} 个文件', style: const TextStyle(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 10),
                          ..._selectedMessageFiles.asMap().entries.map(
                            (entry) {
                              final file = entry.value;
                              return Container(
                                margin: EdgeInsets.only(bottom: entry.key == _selectedMessageFiles.length - 1 ? 0 : 10),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFE0E3EA)),
                                ),
                                child: Row(
                                  children: [
                                    Icon(_attachmentIcon(file.extension ?? '', '')),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(file.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600)),
                                          Text(
                                            '${_formatFileSize(file.size)}${_isImageAttachment(file.extension ?? '', '') ? ' · 图片' : ''}${_sendingMessage ? ' · 发送中' : ''}',
                                            style: Theme.of(context).textTheme.bodySmall,
                                          ),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      tooltip: '移除文件',
                                      onPressed: _sendingMessage
                                          ? null
                                          : () {
                                              setState(() {
                                                _selectedMessageFiles = _selectedMessageFiles.where((item) => item != file).toList();
                                              });
                                            },
                                      icon: const Icon(Icons.close),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                compact
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextField(
                            controller: _messageController,
                            minLines: 1,
                            maxLines: 4,
                            enabled: _activeGroupId != null && _selectedConversationId != null && !_sendingMessage,
                            decoration: InputDecoration(
                              labelText: _activeConversationType == 'agent' ? '输入消息（Agent 会话暂不支持文件）' : '输入消息或附言',
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _activeGroupId == null || _selectedConversationId == null || _sendingMessage
                                      ? null
                                      : _pickChatFiles,
                                  icon: const Icon(Icons.attach_file),
                                  label: const Text('选择文件'),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: FilledButton.icon(
                                  onPressed: _activeGroupId == null || _selectedConversationId == null || _sendingMessage ? null : _sendMessage,
                                  icon: _sendingMessage
                                      ? const SizedBox(
                                          height: 16,
                                          width: 16,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        )
                                      : const Icon(Icons.send),
                                  label: Text(_sendingMessage ? '发送中...' : '发送'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          IconButton(
                            tooltip: '发送文件',
                            onPressed: _activeGroupId == null || _selectedConversationId == null || _sendingMessage
                                ? null
                                : _pickChatFiles,
                            icon: const Icon(Icons.attach_file),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              enabled: _activeGroupId != null && _selectedConversationId != null && !_sendingMessage,
                              decoration: InputDecoration(
                                labelText: '输入消息或附言',
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          FilledButton.icon(
                            onPressed: _activeGroupId == null || _selectedConversationId == null || _sendingMessage ? null : _sendMessage,
                            icon: _sendingMessage
                                ? const SizedBox(
                                    height: 16,
                                    width: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  )
                                : const Icon(Icons.send),
                            label: Text(_sendingMessage ? '发送中...' : '发送'),
                          ),
                        ],
                      ),
              ],
            ),
          ),
        );

        return Padding(
          padding: const EdgeInsets.all(24),
          child: compact
              ? ListView(
                  children: [
                    groupPanel,
                    const SizedBox(height: 16),
                    conversationList,
                    const SizedBox(height: 16),
                    messagePanel,
                  ],
                )
              : ListView(
                  children: [
                    groupPanel,
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 300, child: conversationList),
                        const SizedBox(width: 16),
                        Expanded(child: messagePanel),
                      ],
                    ),
                  ],
                ),
        );
      },
    );
  }

  List<Widget> _buildSubscriptionContent(SubscriptionOverview s) {
    final isExpired = s.planId == 'expired' || s.statusLabel.contains('已过期');
    final isActive = s.effectiveOrder != null && !isExpired && s.planId != 'free';
    final isTrial = s.planId == 'free' && !isExpired;

    return [
      // 状态横幅
      if (isExpired)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.red[50], borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.red[200]!)),
          child: Row(children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red[700], size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text('免费试用已到期，功能受限。请选择套餐继续使用。', style: TextStyle(color: Colors.red[700]))),
          ]),
        )
      else if (isTrial && s.trialEndsAt.isNotEmpty)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.blue[200]!)),
          child: Row(children: [
            Icon(Icons.info_outline, color: Colors.blue[700], size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text('免费试用中，到期时间：${s.trialEndsAt}', style: TextStyle(color: Colors.blue[700]))),
          ]),
        )
      else if (isActive)
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.green[200]!)),
          child: Row(children: [
            Icon(Icons.check_circle_outline, color: Colors.green[700], size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text('${s.effectiveOrder!.planLabel} 生效中，到期：${s.effectiveOrder!.expiredAt}', style: TextStyle(color: Colors.green[700]))),
          ]),
        ),

      // 用量
      Wrap(spacing: 12, runSpacing: 12, children: [
        _MetricTile(label: '项目组', value: s.groupUsage),
        _MetricTile(label: '私有文件', value: s.documentUsage),
        _MetricTile(label: '今日查询', value: s.queryUsage),
      ]),
      const SizedBox(height: 20),

      // 套餐选择
      Text('选择套餐', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 12),
      _SubscriptionPlanRow(
        plans: [
          _PlanOption(id: 'weekly', label: '周订阅', price: s.weeklyPrice, duration: '7 天'),
          _PlanOption(id: 'monthly', label: '月订阅', price: s.monthlyPrice, duration: '30 天'),
          _PlanOption(id: 'yearly', label: '年订阅', price: s.yearlyPrice, duration: '365 天', recommended: true),
        ],
        currentPlanId: s.planId,
        subscribing: _subscribing,
        onSubscribe: _subscribe,
      ),

      // 知识库访问权限
      const SizedBox(height: 20),
      Text('知识库访问权限', style: Theme.of(context).textTheme.titleSmall),
      const SizedBox(height: 4),
      Text('法规库默认可用，以下库需单独购买（1年有效期）', style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 12),
      _LibraryAccessSection(
        libraryAccess: s.libraryAccess,
        apiService: widget.apiService,
        subscribing: _subscribing,
        onBuy: _buyLibraryAccess,
      ),

      // 历史记录
      if (s.orderHistory.isNotEmpty) ...[
        const SizedBox(height: 20),
        Text('开通记录', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        ...s.orderHistory.map((o) => Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Text('${o.planLabel}  ¥${o.amount}  ${o.paidAt} → ${o.expiredAt}',
              style: Theme.of(context).textTheme.bodySmall),
        )),
      ],
    ];
  }

  Widget _buildAccount(AppUser user, SubscriptionOverview subscription) {
    final recentAuditEvents = _overview?.recentAuditEvents ?? const <AuditEventSummary>[];
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        SectionCard(
          title: _isAdmin ? '管理员账户' : '账户信息',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('姓名：${user.name}'),
                  const SizedBox(width: 8),
                  if (!_isAdmin)
                    TextButton(
                      onPressed: () => _showEditNameDialog(user.name),
                      style: TextButton.styleFrom(minimumSize: Size.zero, padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4)),
                      child: const Text('修改'),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Text(_isAdmin ? '管理员账号：admin' : '手机号：${user.phone}'),
              const SizedBox(height: 8),
              Text('角色：${user.role}'),
              if (_isAdmin) ...[
                const SizedBox(height: 8),
                Text(
                  '当前账号用于公共基础库管理与演示预览，不加入项目组，不参与组内协作。',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        SectionCard(
          title: _isAdmin ? '管理员职责' : '订阅与限制',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _isAdmin
                ? [
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: const [
                        SizedBox(width: 180, child: _MetricTile(label: '当前视角', value: '公共库管理')),
                        SizedBox(width: 180, child: _MetricTile(label: '项目组状态', value: '不加入项目组')),
                        SizedBox(width: 180, child: _MetricTile(label: '导入权限', value: '公共库已开启')),
                        SizedBox(width: 180, child: _MetricTile(label: '查询额度', value: '管理员预览')),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ...const [
                      Text('• 负责导入和维护公共制度、规范、审计依据等资料。'),
                      SizedBox(height: 8),
                      Text('• 查询默认仅检索公共基础库，不读取任何项目组私有资料。'),
                      SizedBox(height: 8),
                      Text('• 项目组成员管理、群聊协作和私有库导入已从管理员视角隐藏。'),
                    ],
                  ]
                : _buildSubscriptionContent(subscription),
          ),
        ),
        const SizedBox(height: 16),
        SectionCard(
          title: '最近操作',
          child: recentAuditEvents.isEmpty
              ? const Text('暂无最近操作记录。')
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: recentAuditEvents
                      .map(
                        (event) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Text(
                            '${event.createdAt} · ${event.actorName} · ${event.summary}${event.status == 'failed' ? '（失败）' : ''}',
                          ),
                        ),
                      )
                      .toList(),
                ),
        ),
      ],
    );
  }
}

class _FeatureCardData {
  const _FeatureCardData({required this.icon, required this.color, required this.title, required this.subtitle, required this.queryScope});
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final String queryScope;
}

class _GroupBundle {
  const _GroupBundle({
    required this.conversations,
    required this.members,
    required this.documents,
    required this.extractJobs,
    required this.selectedConversationId,
    required this.messages,
  });

  final List<ConversationSummary> conversations;
  final List<GroupMember> members;
  final List<KnowledgeDocument> documents;
  final List<ExtractionJob> extractJobs;
  final String? selectedConversationId;
  final List<ChatMessage> messages;
}

enum _PendingChatMessageStatus { sending, failed }

class _PendingChatMessage {
  const _PendingChatMessage({
    required this.id,
    required this.content,
    required this.file,
    required this.sentAt,
    required this.status,
    required this.progress,
    this.error,
  });

  final String id;
  final String content;
  final PlatformFile? file;
  final String sentAt;
  final _PendingChatMessageStatus status;
  final double progress;
  final String? error;

  _PendingChatMessage copyWith({
    String? id,
    String? content,
    PlatformFile? file,
    String? sentAt,
    _PendingChatMessageStatus? status,
    double? progress,
    String? error,
  }) {
    return _PendingChatMessage(
      id: id ?? this.id,
      content: content ?? this.content,
      file: file ?? this.file,
      sentAt: sentAt ?? this.sentAt,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      error: error ?? this.error,
    );
  }
}

class _NavPage {
  const _NavPage({required this.label, required this.icon, required this.child});

  final String label;
  final IconData icon;
  final Widget child;
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE3E8F2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 6),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _ImagePreviewDialog extends StatefulWidget {
  const _ImagePreviewDialog({
    required this.attachments,
    required this.initialIndex,
    required this.buildImageUrl,
    required this.onOpenOriginal,
  });

  final List<ChatAttachment> attachments;
  final int initialIndex;
  final String Function(String path) buildImageUrl;
  final Future<void> Function(ChatAttachment attachment) onOpenOriginal;

  @override
  State<_ImagePreviewDialog> createState() => _ImagePreviewDialogState();
}

class _ImagePreviewDialogState extends State<_ImagePreviewDialog> {
  late final PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, widget.attachments.length - 1);
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final attachment = widget.attachments[_currentIndex];
    return Dialog(
      insetPadding: const EdgeInsets.all(24),
      child: SizedBox(
        width: 920,
        height: 680,
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFE0E3EA))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          attachment.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        if (widget.attachments.length > 1)
                          Text(
                            '${_currentIndex + 1} / ${widget.attachments.length}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => widget.onOpenOriginal(attachment),
                    child: const Text('打开原图'),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  IconButton(
                    onPressed: _currentIndex > 0
                        ? () {
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 220),
                              curve: Curves.easeOut,
                            );
                          }
                        : null,
                    icon: const Icon(Icons.chevron_left),
                  ),
                  Expanded(
                    child: PageView.builder(
                      controller: _pageController,
                      itemCount: widget.attachments.length,
                      onPageChanged: (index) {
                        setState(() {
                          _currentIndex = index;
                        });
                      },
                      itemBuilder: (context, index) {
                        final item = widget.attachments[index];
                        return InteractiveViewer(
                          child: Image.network(
                            widget.buildImageUrl(item.path),
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) {
                              return const Padding(
                                padding: EdgeInsets.all(24),
                                child: Text('图片预览加载失败，请使用“打开原图”。'),
                              );
                            },
                          ),
                        );
                      },
                    ),
                  ),
                  IconButton(
                    onPressed: _currentIndex < widget.attachments.length - 1
                        ? () {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 220),
                              curve: Curves.easeOut,
                            );
                          }
                        : null,
                    icon: const Icon(Icons.chevron_right),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanOption {
  const _PlanOption({required this.id, required this.label, required this.price, required this.duration, this.recommended = false});
  final String id;
  final String label;
  final String price;
  final String duration;
  final bool recommended;
}

class _SubscriptionPlanRow extends StatelessWidget {
  const _SubscriptionPlanRow({
    required this.plans,
    required this.currentPlanId,
    required this.subscribing,
    required this.onSubscribe,
  });

  final List<_PlanOption> plans;
  final String currentPlanId;
  final bool subscribing;
  final void Function(String planType) onSubscribe;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: plans.map((plan) {
        final isCurrent = currentPlanId == plan.id;
        return SizedBox(
          width: 140,
          child: Card(
            elevation: isCurrent ? 2 : 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(color: isCurrent ? Theme.of(context).colorScheme.primary : Colors.grey[300]!, width: isCurrent ? 2 : 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(plan.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                      if (plan.recommended) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(4)),
                          child: Text('推荐', style: TextStyle(color: Theme.of(context).colorScheme.onPrimary, fontSize: 11)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(plan.price, style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(plan.duration, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: isCurrent
                        ? OutlinedButton(onPressed: null, child: const Text('当前套餐'))
                        : FilledButton(
                            onPressed: subscribing ? null : () => onSubscribe(plan.id),
                            child: subscribing ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('开通'),
                          ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

const _kRegions = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '湖南', '山东', '河南', '河北', '陕西', '福建', '安徽', '江西', '辽宁', '吉林', '黑龙江', '云南', '贵州', '广西', '内蒙古', '新疆', '西藏', '甘肃', '青海', '宁夏', '海南', '重庆', '天津'];

class _LibraryAccessSection extends StatefulWidget {
  const _LibraryAccessSection({required this.libraryAccess, required this.apiService, required this.subscribing, required this.onBuy});
  final List<LibraryAccessItem> libraryAccess;
  final ApiService apiService;
  final bool subscribing;
  final void Function(String libraryType, String? region) onBuy;

  @override
  State<_LibraryAccessSection> createState() => _LibraryAccessSectionState();
}

class _LibraryAccessSectionState extends State<_LibraryAccessSection> {
  static const _libs = [
    ('local_policy', '地方政策库', '¥50/地区 · ¥200/全部'),
    ('local_case', '地方案例库', '¥50/地区 · ¥200/全部'),
    ('industry', '行业专题库', '¥80/地区 · ¥300/全部'),
  ];

  bool _hasAccess(String libraryType, String? region) {
    return widget.libraryAccess.any(
      (a) => a.libraryType == libraryType && (a.region == null || a.region == region),
    );
  }

  Future<void> _showBuyDialog(String libraryType, String label) async {
    String? region;
    bool buyAll = false;
    final isIndustry = libraryType == 'industry';
    final optionLabel = isIndustry ? '行业' : '地区';
    List<String> availableOptions = [];
    try {
      final regions = await widget.apiService.getLibraryRegions();
      availableOptions = regions[libraryType] ?? [];
    } catch (_) {}
    if (!mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => AlertDialog(
          title: Text('购买 $label'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            CheckboxListTile(
              title: Text('购买全部$optionLabel'),
              value: buyAll,
              onChanged: (v) => set(() { buyAll = v!; if (buyAll) region = null; }),
              contentPadding: EdgeInsets.zero,
            ),
            if (!buyAll)
              Autocomplete<String>(
                optionsBuilder: (v) => v.text.isEmpty
                    ? availableOptions
                    : availableOptions.where((r) => r.contains(v.text)),
                onSelected: (v) => region = v,
                fieldViewBuilder: (ctx2, ctrl, fn, _) => TextField(
                  controller: ctrl,
                  focusNode: fn,
                  decoration: InputDecoration(labelText: '选择$optionLabel', isDense: true),
                  onChanged: (v) => region = v.trim().isEmpty ? null : v.trim(),
                ),
              ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('购买')),
          ],
        ),
      ),
    );
    if (confirmed == true) widget.onBuy(libraryType, buyAll ? null : region);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: _libs.map((lib) {
        final (type, label, price) = lib;
        final hasAccess = _hasAccess(type, null);
        final accessItem = widget.libraryAccess.where((a) => a.libraryType == type).toList();
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            title: Text(label),
            subtitle: Text(
              hasAccess
                  ? '已购（全部地区）到期：${accessItem.first.expiredAt}'
                  : accessItem.isNotEmpty
                      ? '已购地区：${accessItem.map((a) => a.region ?? '全部').join('、')}'
                      : price,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            trailing: OutlinedButton(
              onPressed: widget.subscribing ? null : () => _showBuyDialog(type, label),
              child: const Text('购买'),
            ),
          ),
        );
      }).toList(),
    );
  }
}
