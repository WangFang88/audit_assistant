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
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _loading = true;
  bool _sending = false;
  List<ConversationSummary> _conversations = const [];
  List<ChatMessage> _messages = const [];
  String? _selectedId;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _load();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _poll());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; });
    try {
      final convs = await widget.apiService.fetchConversations();
      if (!mounted) return;
      final selected = convs.isNotEmpty ? convs.first.id : null;
      final messages = selected != null ? await widget.apiService.fetchMessages(selected) : <ChatMessage>[];
      if (!mounted) return;
      setState(() { _conversations = convs; _selectedId = selected; _messages = messages; });
    } catch (_) {
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  Future<void> _poll() async {
    if (_selectedId == null) return;
    try {
      final messages = await widget.apiService.fetchMessages(_selectedId!);
      if (!mounted) return;
      final hasNew = messages.isNotEmpty && (_messages.isEmpty || messages.last.id != _messages.last.id);
      setState(() { _messages = messages; });
      if (hasNew) _scrollToBottom();
    } catch (_) {}
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _selectedId == null) return;
    _messageController.clear();
    setState(() { _sending = true; });
    try {
      await widget.apiService.sendMessage(conversationId: _selectedId!, content: text, conversationType: 'direct');
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
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_conversations.isEmpty) {
      return const Center(child: Text('暂无会话，请先加入项目组'));
    }
    return Column(children: [
      // Conversation selector
      if (_conversations.length > 1)
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            itemCount: _conversations.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              final c = _conversations[i];
              final selected = c.id == _selectedId;
              return ChoiceChip(
                label: Text(c.title, style: const TextStyle(fontSize: 12)),
                selected: selected,
                onSelected: (_) async {
                  setState(() { _selectedId = c.id; _messages = const []; });
                  await _poll();
                },
              );
            },
          ),
        ),
      // Messages
      Expanded(
        child: ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          itemCount: _messages.length,
          itemBuilder: (context, i) => _MessageBubble(
            message: _messages[i],
            isMe: _messages[i].senderName == widget.user.name,
          ),
        ),
      ),
      // Input
      Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant)),
        ),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              maxLines: null,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
              decoration: InputDecoration(
                hintText: '输入消息…',
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(20)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: _sending ? null : _send,
            icon: _sending
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.send),
          ),
        ]),
      ),
    ]);
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
