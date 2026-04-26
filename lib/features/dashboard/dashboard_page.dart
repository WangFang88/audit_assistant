import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';
import '../../shared/widgets/section_card.dart';

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
  DashboardOverview? _overview;
  QueryResult? _result;
  List<ConversationSummary> _conversations = const [];
  List<ChatMessage> _messages = const [];
  List<GroupMember> _members = const [];
  List<KnowledgeDocument> _documents = const [];
  List<ExtractionJob> _extractJobs = const [];
  String? _selectedConversationId;
  String? _selectedGroupId;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  @override
  void dispose() {
    _questionController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  String? get _activeGroupId => _selectedGroupId;

  bool get _isAdmin {
    return widget.currentUser.role == '管理员' || widget.currentUser.role == 'admin';
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

  bool _isCurrentPlan(String planId) {
    return _overview?.subscription.planId == planId;
  }

  String get _activeConversationType {
    final conversation = _selectedConversation;
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

  Future<void> _loadDashboard({String? preferredGroupId}) async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final overview = await widget.apiService.fetchDashboard(groupId: preferredGroupId);
      final resolvedGroupId = _resolveGroupId(overview.groups, preferredGroupId);
      final bundle = await _loadGroupBundle(resolvedGroupId);

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
        _error = '工作台数据加载失败，请确认后端服务正在运行。';
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
      final overview = await widget.apiService.fetchDashboard(groupId: groupId);
      final bundle = await _loadGroupBundle(groupId);

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
        if (_selectedIndex == 1 && _selectedConversationId == null) {
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
    final conversations = _isAdmin ? const <ConversationSummary>[] : await widget.apiService.fetchConversations(groupId: groupId);
    final members = _isAdmin || groupId == null ? const <GroupMember>[] : await widget.apiService.fetchMembers(groupId);
    final documents = await widget.apiService.fetchDocuments(groupId: _isAdmin ? null : groupId);
    final extractJobs = await widget.apiService.fetchExtractionJobs(groupId: _isAdmin ? null : groupId);
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

    if (groupId != null) {
      for (final conversation in conversations) {
        if (conversation.type == '群聊' && conversation.groupId == groupId) {
          return conversation.id;
        }
      }
    }

    return conversations.first.id;
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
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _result = result;
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

  Future<void> _loadConversationMessages(String conversationId) async {
    if (_isAdmin) {
      return;
    }

    setState(() {
      _chatLoading = true;
      _selectedConversationId = conversationId;
      _error = null;
    });

    try {
      final messages = await widget.apiService.fetchMessages(conversationId);
      if (!mounted) {
        return;
      }
      setState(() {
        _messages = messages;
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

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (_isAdmin || _selectedConversationId == null) {
      return;
    }

    if (content.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请输入消息内容后再发送。')));
      return;
    }

    setState(() {
      _sendingMessage = true;
      _error = null;
    });

    try {
      await widget.apiService.sendMessage(
        conversationId: _selectedConversationId!,
        conversationType: _activeConversationType,
        content: content,
        groupId: _activeConversationType == 'group' ? _activeGroupId : null,
      );
      _messageController.clear();
      await _loadConversationMessages(_selectedConversationId!);
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
        _error = '消息发送失败。';
      });
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
    if (_isAdmin) {
      return;
    }

    setState(() {
      _subscribing = true;
      _error = null;
    });

    try {
      await widget.apiService.createSubscriptionOrder(planType: planType);
      await _loadDashboard(preferredGroupId: _activeGroupId);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('订阅已更新。')));
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
        _error = '订阅更新失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _subscribing = false;
        });
      }
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
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请先选择项目组后再邀请成员。')));
      return;
    }

    final phoneController = TextEditingController();
    String selectedRole = '成员';

    final confirmed = await showDialog<bool>(
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
                  DropdownMenuItem(value: '组长', child: Text('组长')),
                ],
                onChanged: (value) => setDialogState(() => selectedRole = value ?? '成员'),
                decoration: const InputDecoration(labelText: '角色'),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
            FilledButton(
              onPressed: () {
                final phone = phoneController.text.trim();
                if (phone.isEmpty || phone.length < 11) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('请输入 11 位手机号后再发送邀请。')),
                  );
                  return;
                }
                Navigator.pop(context, true);
              },
              child: const Text('发送邀请'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) {
      return;
    }

    try {
      await widget.apiService.inviteMember(
        groupId: _activeGroupId!,
        phone: phoneController.text.trim(),
        role: selectedRole,
      );
      await _refreshMembers();
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    }
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
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('移交组长'),
          content: DropdownButtonFormField<String>(
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
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('确认移交')),
          ],
        ),
      ),
    );

    if (confirmed != true || selectedUserId == null) {
      return;
    }

    try {
      await widget.apiService.transferLeader(
        groupId: _activeGroupId!,
        targetUserId: selectedUserId!,
      );
      await _refreshMembers();
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
      });
    }
  }

  Future<void> _removeMember(GroupMember member) async {
    if (_isAdmin || _activeGroupId == null || member.role == '组长') {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('确认清退成员'),
        content: Text('确定要将 ${member.name} 移出当前项目组吗？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('确认清退')),
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
      await _refreshMembers();
      await _loadDashboard(preferredGroupId: _activeGroupId);
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
        _error = '成员清退失败。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _membersLoading = false;
        });
      }
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

  TextSpan _buildHighlightedChunkText(BuildContext context, String content, List<String> keywords) {
    final theme = Theme.of(context);
    final normalizedKeywords = keywords
        .map((item) => item.trim())
        .where((item) => item.length >= 2)
        .toSet()
        .toList()
      ..sort((a, b) => b.length.compareTo(a.length));

    if (normalizedKeywords.isEmpty) {
      return TextSpan(text: content, style: theme.textTheme.bodyMedium);
    }

    final lowerContent = content.toLowerCase();
    final spans = <TextSpan>[];
    var index = 0;

    while (index < content.length) {
      String? matchedKeyword;
      for (final keyword in normalizedKeywords) {
        if (index + keyword.length > content.length) {
          continue;
        }
        if (lowerContent.substring(index, index + keyword.length) == keyword.toLowerCase()) {
          matchedKeyword = content.substring(index, index + keyword.length);
          break;
        }
      }

      if (matchedKeyword != null) {
        spans.add(
          TextSpan(
            text: matchedKeyword,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
              backgroundColor: const Color(0xFFFFF3BF),
            ),
          ),
        );
        index += matchedKeyword.length;
        continue;
      }

      spans.add(TextSpan(text: content[index], style: theme.textTheme.bodyMedium));
      index += 1;
    }

    return TextSpan(children: spans, style: theme.textTheme.bodyMedium);
  }

  Future<void> _copyChunkContent(String content) async {
    await Clipboard.setData(ClipboardData(text: content));
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('文本块内容已复制。')));
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
                : SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: chunks
                          .map(
                            (chunk) => Container(
                              width: double.infinity,
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFF),
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
                                        child: RichText(
                                          text: _buildHighlightedChunkText(context, chunk.content, chunk.keywords),
                                        ),
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
                            ),
                          )
                          .toList(),
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
    String libraryType = _isAdmin || _activeGroupId == null ? '公共库' : '私有库';
    PlatformFile? selectedFile;

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
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('选择文件失败：${error.message ?? '请检查当前运行环境的文件选择权限。'}')),
                        );
                      } catch (_) {
                        if (!mounted) {
                          return;
                        }
                        ScaffoldMessenger.of(context).showSnackBar(
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
                      const DropdownMenuItem(value: '公共库', child: Text('公共库')),
                      if (!_isAdmin && _activeGroupId != null) const DropdownMenuItem(value: '私有库', child: Text('私有库')),
                    ],
                    onChanged: (value) => setDialogState(() => libraryType = value ?? (_isAdmin || _activeGroupId == null ? '公共库' : '私有库')),
                    decoration: const InputDecoration(labelText: '入库范围'),
                  ),
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
        rawText: rawTextController.text.trim().isEmpty ? null : rawTextController.text.trim(),
        groupId: libraryType == '私有库' ? _activeGroupId : null,
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
          title: Text(pages[_selectedIndex].label),
          actions: [
            IconButton(onPressed: () => _loadDashboard(preferredGroupId: _selectedGroupId), icon: const Icon(Icons.refresh)),
            TextButton(onPressed: widget.onLogout, child: const Text('退出')),
          ],
        ),
        body: pages[_selectedIndex].child,
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          destinations: pages
              .map((page) => NavigationDestination(icon: Icon(page.icon), label: page.label))
              .toList(),
          onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('小嘉审计助手'),
        actions: [
          IconButton(onPressed: () => _loadDashboard(preferredGroupId: _selectedGroupId), icon: const Icon(Icons.refresh)),
          TextButton(onPressed: widget.onLogout, child: const Text('退出')),
        ],
      ),
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: _selectedIndex,
            labelType: NavigationRailLabelType.all,
            onDestinationSelected: (index) => setState(() => _selectedIndex = index),
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('你好，${user.name}', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(
            _isAdmin
                ? '当前角色：管理员 · 当前视角：公共库管理'
                : '当前角色：${user.role} · 试用到期：${user.trialEndsAt} · 全功能试用 ${subscription.trialDays} 天',
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 320,
                child: _isAdmin
                    ? const InputDecorator(
                        decoration: InputDecoration(labelText: '当前视角'),
                        child: Text('管理员公共库'),
                      )
                    : DropdownButtonFormField<String>(
                        initialValue: _selectedGroupId,
                        decoration: const InputDecoration(labelText: '当前项目组'),
                        items: groups
                            .map(
                              (group) => DropdownMenuItem(
                                value: group.id,
                                child: Text('${group.name} · ${group.organizationName}'),
                              ),
                            )
                            .toList(),
                        onChanged: _switchingGroup ? null : _switchGroup,
                      ),
              ),
              if (_switchingGroup) ...[
                const SizedBox(width: 12),
                const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              Chip(label: Text('当前范围：${activeContext.queryScopeLabel}')),
              Chip(label: Text(_isAdmin ? '当前视角：管理员公共库' : activeContext.groupName == null ? '未进入项目组' : '当前项目组：${activeContext.groupName}')),
              const Chip(label: Text('回答要求：可溯源')),
              Chip(label: Text('交付目标：${architectureTargets.deliveryMode}')),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _isAdmin ? '管理员仅检索公共库资料，不加载项目组成员、群聊协作与私有库上下文。' : activeContext.isolationNotice,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 24),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: _isAdmin
                ? [
                    _StatChip(label: '当前模式', value: '管理员公共库管理'),
                    _StatChip(label: '公共库导入', value: '已开启'),
                    _StatChip(label: '查询范围', value: '仅公共库'),
                    _StatChip(label: '查询能力', value: '管理员预览'),
                  ]
                : [
                    _StatChip(label: subscription.planName, value: subscription.priceLabel),
                    _StatChip(label: '项目组额度', value: subscription.groupUsage),
                    _StatChip(label: '私有文件额度', value: subscription.documentUsage),
                    _StatChip(label: '查询额度', value: subscription.queryUsage),
                  ],
          ),
          const SizedBox(height: 16),
          SectionCard(
            title: _isAdmin ? '公共库管理路线' : '订阅限制与路线',
            subtitle: _isAdmin ? '管理员公共库视角、版本规划与目标架构。' : '免费版限制、版本规划与目标架构。',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: (_isAdmin
                          ? const [
                              '管理员不加入项目组，仅管理公共库资料',
                              '公共库导入已开启，可直接导入制度与规范文件',
                              '管理员查询不受演示额度限制',
                              '私有库协作、群聊和成员管理已隐藏',
                            ]
                          : subscription.planHighlights)
                      .map((item) => Chip(label: Text(item)))
                      .toList(),
                ),
                if (!_isAdmin) ...[
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      SizedBox(width: 180, child: _MetricTile(label: '周订阅', value: subscription.weeklyPrice)),
                      SizedBox(width: 180, child: _MetricTile(label: '月订阅', value: subscription.monthlyPrice)),
                      SizedBox(width: 180, child: _MetricTile(label: '年订阅', value: subscription.yearlyPrice)),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                Text('版本路线', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                ...roadmap.map(
                  (item) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${item.version} · ${item.title}'),
                    subtitle: Text('${item.deadline} · ${item.ragFocus}'),
                  ),
                ),
                const Divider(height: 24),
                Text('目标架构', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    Chip(label: Text('生成模型：${architectureTargets.generationProviderTarget}')),
                    Chip(label: Text('向量库：${architectureTargets.vectorStoreTarget}')),
                    Chip(label: Text('检索模式：${architectureTargets.retrievalMode}')),
                    Chip(label: Text('解析链路：${architectureTargets.parserTarget}')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          LayoutBuilder(
            builder: (context, constraints) {
              final singleColumn = constraints.maxWidth < 1100;
              if (singleColumn) {
                return Column(
                  children: [
                    if (!_isAdmin) ...[
                      _buildQueryPanel(activeContext),
                      const SizedBox(height: 16),
                      _buildResultPanel(context, result),
                    ],
                    _buildDocumentPanel(documents, extractJobs),
                  ],
                );
              }

              return Column(
                children: [
                  if (!_isAdmin) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 5, child: _buildQueryPanel(activeContext)),
                        const SizedBox(width: 16),
                        Expanded(flex: 6, child: _buildResultPanel(context, result)),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  _buildDocumentPanel(documents, extractJobs),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQueryPanel(ActiveContext activeContext) {
    return SectionCard(
      title: '统一查询',
      subtitle: '先限定双库范围，再做混合检索，最后生成可溯源答案。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _questionController,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: '输入审计问题或检索需求',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              Chip(label: Text('检索范围：${activeContext.queryScopeLabel}')),
              Chip(label: Text(activeContext.isolationNotice)),
              const Chip(label: Text('检索策略：关键词 + 语义混合召回')),
              const Chip(label: Text('扫描件：仅必要时 OCR')),
              if (!_isAdmin && _hasReachedDailyQueryLimit) const Chip(label: Text('今日查询额度已用尽')),
            ],
          ),
          const SizedBox(height: 12),
          if (!_isAdmin && _hasReachedDailyQueryLimit)
            Text(
              '免费版每日仅支持 ${_overview?.subscription.dailyQueriesLimit ?? 0} 次 RAG 查询，当前已达到上限。',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _searching || _switchingGroup || (!_isAdmin && _hasReachedDailyQueryLimit) ? null : _runSearch,
            child: _searching
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('执行检索'),
          ),
        ],
      ),
    );
  }

  Widget _buildResultPanel(BuildContext context, QueryResult result) {
    final theme = Theme.of(context);

    return SectionCard(
      title: '检索结果',
      subtitle: _isAdmin ? '返回答案、公共库引用条款与管理员检索元信息。' : '返回答案、引用条款、范围说明与当前原型的 RAG 元信息。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              Chip(label: Text('结果范围：${result.scope.label}')),
              Chip(label: Text('目标模型：${result.ragMeta.generationProviderTarget}')),
              Chip(label: Text('检索模式：${result.ragMeta.retrievalMode}')),
              Chip(label: Text('原型状态：${result.ragMeta.prototypeMode}')),
              Chip(label: Text(result.ragMeta.answerTraceable ? '回答可溯源' : '回答未溯源')),
            ],
          ),
          const SizedBox(height: 12),
          Text(result.scope.isolationNotice, style: theme.textTheme.bodySmall),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FC),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('系统回答', style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                Text(result.answer),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: result.pipeline.map((step) => Chip(label: Text(step))).toList(),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              SizedBox(width: 180, child: _MetricTile(label: '检索模式', value: result.retrievalStats.queryMode)),
              SizedBox(
                width: 160,
                child: _MetricTile(label: '候选文本块', value: '${result.retrievalStats.candidateChunks}'),
              ),
              SizedBox(
                width: 160,
                child: _MetricTile(label: '返回条款', value: '${result.retrievalStats.returnedCitations}'),
              ),
              SizedBox(
                width: 160,
                child: _MetricTile(label: '公共库命中', value: '${result.retrievalStats.publicLibraryHits}'),
              ),
              if (_isAdmin)
                const SizedBox(
                  width: 180,
                  child: _MetricTile(label: '当前结果范围', value: '仅公共库命中'),
                )
              else
                SizedBox(
                  width: 160,
                  child: _MetricTile(label: '私有库命中', value: '${result.retrievalStats.privateLibraryHits}'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text('引用条款', style: theme.textTheme.titleSmall),
          const SizedBox(height: 12),
          ...result.citations.map(
            (citation) => Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFD9E3F0)),
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0D0F172A),
                    blurRadius: 12,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(citation.title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                      Chip(label: Text(_isAdmin ? '公共库' : citation.libraryType == 'private' ? '项目组私有库' : '公共库')),
                      Chip(label: Text('命中 ${(citation.score * 100).toStringAsFixed(0)}%')),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Chip(label: Text(citation.chapterTitle)),
                      Chip(label: Text(citation.articleRef)),
                      Chip(label: Text(citation.pageLabel)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text('命中片段', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 6),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(citation.matchedChunk),
                  ),
                  const SizedBox(height: 12),
                  Text('命中原因', style: theme.textTheme.labelLarge),
                  const SizedBox(height: 6),
                  Text(citation.reason, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          ),
          Text(result.explanation, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildGroupPanel(List<ProjectGroup> groups) {
    return SectionCard(
      title: '项目组',
      subtitle: '支持创建、邀请、清退、移交组长。',
      action: Wrap(
        spacing: 8,
        children: [
          FilledButton.tonal(onPressed: _activeGroupId == null ? null : _showInviteDialog, child: const Text('邀请成员')),
          FilledButton.tonal(onPressed: _hasReachedGroupLimit ? null : _showCreateGroupDialog, child: const Text('创建项目组')),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_activeGroupId == null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                '当前未选择项目组，成员邀请、组长移交与群聊协作将保持禁用。',
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
                  TextButton(
                    onPressed: _switchingGroup ? null : () => _deleteGroup(group),
                    child: const Text('删除'),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 24),
          Row(
            children: [
              Text('成员列表', style: Theme.of(context).textTheme.titleSmall),
              const Spacer(),
              TextButton(onPressed: _activeGroupId == null || _membersLoading ? null : _refreshMembers, child: const Text('刷新成员')),
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
              trailing: member.role == '组长'
                  ? const Text('当前组长')
                  : TextButton(
                      onPressed: _membersLoading ? null : () => _removeMember(member),
                      child: const Text('清退'),
                    ),
            ),
          ),
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
          FilledButton.tonal(onPressed: _documentsLoading ? null : _refreshDocuments, child: const Text('刷新任务')),
          FilledButton.tonal(
            onPressed: (_activeGroupId != null || _canImportPublicDocuments) && !(_hasReachedPrivateDocumentLimit && _activeGroupId != null)
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
          ...documents.map(
            (document) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE3E8F2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(document.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                      Chip(label: Text(document.libraryType)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('${document.fileType} · ${document.extractionMode} · ${document.indexStatus}'),
                  const SizedBox(height: 6),
                  Text('上传路径：${document.sourcePath}', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 4),
                  Text('入库时间：${document.uploadedAt}', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      Chip(label: Text('切分：${document.chunkStrategy}')),
                      Chip(label: Text('阶段：${document.pipelineStage}')),
                      Chip(label: Text('解析：${document.parserTarget}')),
                      Chip(label: Text('向量模型：${document.embeddingTarget}')),
                      Chip(label: Text('向量库：${document.vectorStoreTarget}')),
                      Chip(label: Text(document.chunkCount == 0 ? '文本块：待生成' : '文本块：${document.chunkCount}')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton(
                      onPressed: () => _showDocumentChunksDialog(document),
                      child: const Text('查看文本块'),
                    ),
                  ),
                ],
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
          ...extractJobs.map(
            (job) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('${job.stage} · ${job.status}'),
              subtitle: Text('文档 ${job.documentId} · ${job.startedAt}'),
              trailing: Text('${job.progress}%'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChat() {
    final activeConversation = _selectedConversation;

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 960;
        final groupPanel = _buildGroupPanel(_overview?.groups ?? const []);
        final conversationList = SectionCard(
          title: '对话列表',
          subtitle: _activeGroupId == null ? '请先在上方项目组面板中创建或选择项目组。' : '已按当前项目组上下文刷新会话与消息。',
          child: SizedBox(
            height: compact ? 320 : 560,
            child: _activeGroupId == null
                ? Center(
                    child: Text(
                      '请先创建或选择项目组。',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  )
                : ListView(
                    children: _conversations
                        .map(
                          (item) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            selected: item.id == _selectedConversationId,
                            onTap: () => _loadConversationMessages(item.id),
                            leading: CircleAvatar(child: Text(item.type == '群聊' ? '群' : '私')),
                            title: Text(item.title),
                            subtitle: Text(item.lastMessage),
                            trailing: item.unreadCount > 0 ? Chip(label: Text('${item.unreadCount}')) : null,
                          ),
                        )
                        .toList(),
                  ),
          ),
        );

        final messagePanel = SectionCard(
          title: activeConversation?.title ?? '消息详情',
          subtitle: _activeGroupId == null ? '请先在上方项目组面板中创建或选择项目组。' : activeConversation == null ? '请选择一个会话。' : '支持读取和发送消息。',
          child: SizedBox(
            height: compact ? 420 : 560,
            child: Column(
              children: [
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
                          : ListView(
                              children: _messages
                                  .map(
                                    (message) {
                                      final isCurrentUser = message.senderName == widget.currentUser.name;
                                      return Align(
                                        alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
                                        child: Container(
                                          margin: const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.all(12),
                                          constraints: const BoxConstraints(maxWidth: 420),
                                          decoration: BoxDecoration(
                                            color: isCurrentUser
                                                ? const Color(0xFFE8F1FF)
                                                : const Color(0xFFF7F7FA),
                                            borderRadius: BorderRadius.circular(14),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(message.senderName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                              const SizedBox(height: 6),
                                              Text(message.content),
                                              const SizedBox(height: 6),
                                              Text(message.sentAt, style: Theme.of(context).textTheme.bodySmall),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  )
                                  .toList(),
                            ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        enabled: _activeGroupId != null && _selectedConversationId != null && !_sendingMessage,
                        decoration: const InputDecoration(labelText: '输入消息'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    FilledButton(
                      onPressed: _activeGroupId == null || _selectedConversationId == null || _sendingMessage ? null : _sendMessage,
                      child: _sendingMessage
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('发送'),
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

  Widget _buildAccount(AppUser user, SubscriptionOverview subscription) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        SectionCard(
          title: _isAdmin ? '管理员账户' : '账户信息',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('姓名：${user.name}'),
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
                : [
                    Text(subscription.planName),
                    const SizedBox(height: 8),
                    Text(subscription.priceLabel),
                    const SizedBox(height: 8),
                    Text(subscription.groupUsage),
                    const SizedBox(height: 8),
                    Text(subscription.documentUsage),
                    const SizedBox(height: 8),
                    Text(subscription.queryUsage),
                    if (subscription.latestOrder != null) ...[
                      const SizedBox(height: 8),
                      Text('最近订单：${subscription.latestOrder!.id}'),
                      const SizedBox(height: 8),
                      Text('支付金额：¥${subscription.latestOrder!.amount}'),
                      const SizedBox(height: 8),
                      Text('支付时间：${subscription.latestOrder!.paidAt}'),
                      const SizedBox(height: 8),
                      Text('到期时间：${subscription.latestOrder!.expiredAt}'),
                    ],
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        FilledButton.tonal(
                          onPressed: _subscribing || _isCurrentPlan('weekly') ? null : () => _subscribe('weekly'),
                          child: _subscribing && !_isCurrentPlan('monthly') && !_isCurrentPlan('yearly')
                              ? const Text('处理中...')
                              : Text(_isCurrentPlan('weekly') ? '当前为周订阅' : '开通周订阅'),
                        ),
                        FilledButton.tonal(
                          onPressed: _subscribing || _isCurrentPlan('monthly') ? null : () => _subscribe('monthly'),
                          child: Text(_isCurrentPlan('monthly') ? '当前为月订阅' : '开通月订阅'),
                        ),
                        FilledButton(
                          onPressed: _subscribing || _isCurrentPlan('yearly') ? null : () => _subscribe('yearly'),
                          child: Text(_isCurrentPlan('yearly') ? '当前为年订阅' : '开通年订阅'),
                        ),
                      ],
                    ),
                  ],
          ),
        ),
      ],
    );
  }
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

class _NavPage {
  const _NavPage({required this.label, required this.icon, required this.child});

  final String label;
  final IconData icon;
  final Widget child;
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
