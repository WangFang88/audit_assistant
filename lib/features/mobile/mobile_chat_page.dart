import 'dart:async';
import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';

class MobileChatPage extends StatefulWidget {
  const MobileChatPage({super.key, required this.apiService, required this.user});
  final ApiService apiService;
  final AppUser user;

  @override
  State<MobileChatPage> createState() => _MobileChatPageState();
}

class _MobileChatPageState extends State<MobileChatPage> {
  bool _loading = true;
  List<ConversationSummary> _conversations = const [];
  List<ProjectGroup> _groups = const [];
  String? _selectedGroupId;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _load());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      if (_groups.isEmpty) {
        final overview = await widget.apiService.fetchDashboard();
        if (!mounted) return;
        _groups = overview.groups;
        _selectedGroupId = _groups.isNotEmpty ? _groups.first.id : null;
      }
      final convs = await widget.apiService.fetchConversations(groupId: _selectedGroupId);
      if (!mounted) return;
      setState(() { _conversations = convs; _loading = false; });
    } catch (_) {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_conversations.isEmpty && _groups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 64, color: theme.colorScheme.outline),
            const SizedBox(height: 16),
            Text('暂无聊天会话', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('请先加入项目组开始对话', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline)),
          ],
        ),
      );
    }
    return Column(
      children: [
        if (_groups.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHighest,
              border: Border(bottom: BorderSide(color: theme.dividerColor)),
            ),
            child: Row(
              children: [
                const Icon(Icons.group, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: _groups.length > 1
                      ? DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedGroupId,
                            isExpanded: true,
                            items: _groups.map((g) => DropdownMenuItem(value: g.id, child: Text(g.name))).toList(),
                            onChanged: (v) {
                              if (v != null && v != _selectedGroupId) {
                                setState(() {
                                  _selectedGroupId = v;
                                  _loading = true;
                                });
                                _load();
                              }
                            },
                          ),
                        )
                      : Text(
                          _groups.first.name,
                          style: theme.textTheme.titleSmall,
                        ),
                ),
              ],
            ),
          ),
        ],
        Expanded(
          child: _conversations.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline, size: 64, color: theme.colorScheme.outline),
                      const SizedBox(height: 16),
                      Text('暂无聊天会话', style: theme.textTheme.titleMedium),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: _conversations.length,
                    separatorBuilder: (_, __) => Divider(height: 1, indent: 72, color: theme.colorScheme.outlineVariant),
                    itemBuilder: (context, i) {
                      final c = _conversations[i];
          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: CircleAvatar(
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Icon(_getIcon(c.type), color: theme.colorScheme.onPrimaryContainer),
            ),
            title: Row(
              children: [
                Expanded(child: Text(c.title, style: theme.textTheme.titleSmall, maxLines: 1, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: 8),
                Text(c.lastMessageAt, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
              ],
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(c.lastMessage, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            ),
            trailing: c.unreadCount > 0
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.error,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('${c.unreadCount}', style: TextStyle(color: theme.colorScheme.onError, fontSize: 12, fontWeight: FontWeight.bold)),
                  )
                : null,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => _ChatDetailPage(
                  apiService: widget.apiService,
                  user: widget.user,
                  conversation: c,
                ),
              ),
            ),
          );
        },
      ),
    ),
        ),
      ],
    );
  }

  IconData _getIcon(String type) {
    if (type == '群聊') return Icons.group;
    if (type == '项目组Agent') return Icons.smart_toy;
    return Icons.person;
  }
}

class _ChatDetailPage extends StatefulWidget {
  const _ChatDetailPage({required this.apiService, required this.user, required this.conversation});
  final ApiService apiService;
  final AppUser user;
  final ConversationSummary conversation;

  @override
  State<_ChatDetailPage> createState() => _ChatDetailPageState();
}

class _ChatDetailPageState extends State<_ChatDetailPage> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _loading = true;
  bool _sending = false;
  List<ChatMessage> _messages = const [];
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => _poll());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final messages = await widget.apiService.fetchMessages(widget.conversation.id);
      if (!mounted) return;
      setState(() { _messages = messages; _loading = false; });
      _scrollToBottom();
    } catch (_) {
      if (mounted) setState(() { _loading = false; });
    }
  }

  Future<void> _poll() async {
    try {
      final messages = await widget.apiService.fetchMessages(widget.conversation.id);
      if (!mounted) return;
      final hasNew = messages.isNotEmpty && (_messages.isEmpty || messages.last.id != _messages.last.id);
      setState(() { _messages = messages; });
      if (hasNew) _scrollToBottom();
    } catch (_) {}
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    final type = widget.conversation.type == '群聊' ? 'group' : widget.conversation.type == '项目组Agent' ? 'agent' : 'direct';
    _messageController.clear();
    setState(() { _sending = true; });
    try {
      await widget.apiService.sendMessage(conversationId: widget.conversation.id, content: text, conversationType: type);
      await _poll();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('发送失败：$e')));
    } finally {
      if (mounted) setState(() { _sending = false; });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.conversation.title),
        centerTitle: true,
      ),
      body: Column(children: [
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _messages.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.smart_toy_outlined, size: 64, color: theme.colorScheme.primary),
                            const SizedBox(height: 16),
                            Text('你好！我是小嘉审计助手', style: theme.textTheme.titleMedium),
                            const SizedBox(height: 8),
                            Text('有什么可以帮助你的吗？', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.outline)),
                            const SizedBox(height: 24),
                            Text('你可以这样问我：', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                            const SizedBox(height: 8),
                            Text('• 政府采购法有哪些规定？', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                            Text('• 学校食堂采购审计风险点', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                            Text('• 帮我分析这个案例...', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) => _MessageBubble(
                        message: _messages[i],
                        isMe: _messages[i].senderName == widget.user.name,
                      ),
                    ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant, width: 1)),
          ),
          child: SafeArea(
            top: false,
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  maxLines: null,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: InputDecoration(
                    hintText: '💬 输入消息...',
                    isDense: true,
                    filled: true,
                    fillColor: theme.colorScheme.surfaceContainerHighest,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _sending ? null : _send,
                icon: _sending
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.onPrimary),
                      )
                    : const Icon(Icons.send_rounded),
                style: IconButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message, required this.isMe});
  final ChatMessage message;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(radius: 14, child: Text(message.senderName.isNotEmpty ? message.senderName[0] : '?', style: const TextStyle(fontSize: 11))),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isMe ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHigh,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 16),
                ),
              ),
              child: Text(
                message.content,
                style: TextStyle(color: isMe ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface, fontSize: 14),
              ),
            ),
          ),
          if (isMe) const SizedBox(width: 6),
        ],
      ),
    );
  }
}
