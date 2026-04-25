import 'package:flutter/material.dart';

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
  bool _searching = false;
  bool _chatLoading = false;
  bool _sendingMessage = false;
  bool _membersLoading = false;
  String? _error;
  DashboardOverview? _overview;
  QueryResult? _result;
  List<ConversationSummary> _conversations = const [];
  List<ChatMessage> _messages = const [];
  List<GroupMember> _members = const [];
  String? _selectedConversationId;

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

  String? get _activeGroupId {
    final groups = _overview?.groups;
    if (groups == null || groups.isEmpty) {
      return null;
    }
    return groups.first.id;
  }

  String get _activeConversationType {
    final conversation = _conversations.where((item) => item.id == _selectedConversationId).firstOrNull;
    return conversation?.type == '群聊' ? 'group' : 'direct';
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final overview = await widget.apiService.fetchDashboard();
      final conversations = await widget.apiService.fetchConversations();
      final groupId = overview.groups.isNotEmpty ? overview.groups.first.id : null;
      final members = groupId == null ? const <GroupMember>[] : await widget.apiService.fetchMembers(groupId);
      final selectedConversationId = conversations.isNotEmpty ? conversations.first.id : null;
      final messages = selectedConversationId == null
          ? const <ChatMessage>[]
          : await widget.apiService.fetchMessages(selectedConversationId);

      if (!mounted) {
        return;
      }

      setState(() {
        _overview = overview;
        _result = overview.featuredQuery;
        _conversations = conversations;
        _members = members;
        _selectedConversationId = selectedConversationId;
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

  Future<void> _runSearch() async {
    final question = _questionController.text.trim();
    if (question.isEmpty) {
      return;
    }

    setState(() {
      _searching = true;
      _error = null;
    });

    try {
      final result = await widget.apiService.search(
        question: question,
        groupId: _activeGroupId,
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
    if (_selectedConversationId == null || _messageController.text.trim().isEmpty) {
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
        content: _messageController.text.trim(),
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
    if (_activeGroupId == null) {
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

  Future<void> _showCreateGroupDialog() async {
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
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('创建')),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    try {
      await widget.apiService.createGroup(
        name: nameController.text.trim(),
        organizationName: organizationController.text.trim(),
      );
      await _loadDashboard();
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
    if (_activeGroupId == null) {
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
                value: selectedRole,
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
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('发送邀请')),
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
    if (_activeGroupId == null || _members.isEmpty) {
      return;
    }

    String? selectedUserId = _members.first.userId;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('移交组长'),
          content: DropdownButtonFormField<String>(
            value: selectedUserId,
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
          overview.documents,
          overview.subscription,
          result,
        ),
      ),
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
            IconButton(onPressed: _loadDashboard, icon: const Icon(Icons.refresh)),
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
          IconButton(onPressed: _loadDashboard, icon: const Icon(Icons.refresh)),
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
    SubscriptionOverview subscription,
    QueryResult result,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('你好，${user.name}', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('当前角色：${user.role} · 试用到期：${user.trialEndsAt}'),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 24),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _StatChip(label: subscription.planName, value: subscription.priceLabel),
              _StatChip(label: '项目组额度', value: subscription.groupUsage),
              _StatChip(label: '私有文件额度', value: subscription.documentUsage),
              _StatChip(label: '查询额度', value: subscription.queryUsage),
            ],
          ),
          const SizedBox(height: 24),
          LayoutBuilder(
            builder: (context, constraints) {
              final singleColumn = constraints.maxWidth < 1100;
              if (singleColumn) {
                return Column(
                  children: [
                    _buildQueryPanel(),
                    const SizedBox(height: 16),
                    _buildResultPanel(context, result),
                    const SizedBox(height: 16),
                    _buildGroupPanel(groups),
                    const SizedBox(height: 16),
                    _buildDocumentPanel(documents),
                  ],
                );
              }

              return Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 5, child: _buildQueryPanel()),
                      const SizedBox(width: 16),
                      Expanded(flex: 6, child: _buildResultPanel(context, result)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: _buildGroupPanel(groups)),
                      const SizedBox(width: 16),
                      Expanded(child: _buildDocumentPanel(documents)),
                    ],
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildQueryPanel() {
    return SectionCard(
      title: '统一查询',
      subtitle: '先过滤，再检索，再生成；优先命中已切分文本块。',
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
            children: const [
              Chip(label: Text('检索范围：公共库 + 当前项目组私有库')),
              Chip(label: Text('大文件：导入时异步处理')),
              Chip(label: Text('扫描件：仅必要时 OCR')),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _searching ? null : _runSearch,
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
    return SectionCard(
      title: '检索结果',
      subtitle: '返回答案、引用条款与性能友好的检索路径。',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(result.answer),
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
            ],
          ),
          const SizedBox(height: 16),
          Text('引用条款', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 12),
          ...result.citations.map(
            (citation) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFF),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(citation.title, style: const TextStyle(fontWeight: FontWeight.w600))),
                      Chip(label: Text('${citation.libraryType} ${(citation.score * 100).toStringAsFixed(0)}%')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('${citation.chapterTitle} · ${citation.articleRef} · ${citation.pageLabel}'),
                  const SizedBox(height: 8),
                  Text(citation.matchedChunk),
                  const SizedBox(height: 8),
                  Text(citation.reason, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ),
          Text(result.explanation, style: Theme.of(context).textTheme.bodySmall),
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
          FilledButton.tonal(onPressed: _showInviteDialog, child: const Text('邀请成员')),
          FilledButton.tonal(onPressed: _showCreateGroupDialog, child: const Text('创建项目组')),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ...groups.map(
            (group) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(group.name),
              subtitle: Text('${group.organizationName} · 成员 ${group.memberCount} 人 · 私有文件 ${group.privateDocumentCount} 个'),
              trailing: Text(group.lastQueryAt),
            ),
          ),
          const Divider(height: 24),
          Row(
            children: [
              Text('成员列表', style: Theme.of(context).textTheme.titleSmall),
              const Spacer(),
              TextButton(onPressed: _membersLoading ? null : _refreshMembers, child: const Text('刷新成员')),
              TextButton(onPressed: _showTransferLeaderDialog, child: const Text('移交组长')),
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
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentPanel(List<KnowledgeDocument> documents) {
    return SectionCard(
      title: '知识库文件',
      subtitle: '导入即抽取文字、结构化切分、预建索引。',
      action: FilledButton.tonal(onPressed: () {}, child: const Text('导入文件')),
      child: Column(
        children: documents
            .map(
              (document) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(document.title),
                subtitle: Text('${document.libraryType} · ${document.fileType} · ${document.extractionMode} · ${document.indexStatus}'),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(document.chunkCount == 0 ? '--' : '${document.chunkCount} 块'),
                    const SizedBox(height: 4),
                    Text(document.chunkStrategy, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildChat() {
    final activeConversation = _conversations.where((item) => item.id == _selectedConversationId).firstOrNull;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          SizedBox(
            width: 300,
            child: SectionCard(
              title: '对话列表',
              subtitle: '已接入真实 conversations/messages 接口。',
              child: Column(
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
          ),
          const SizedBox(width: 16),
          Expanded(
            child: SectionCard(
              title: activeConversation?.title ?? '消息详情',
              subtitle: activeConversation == null ? '请选择一个会话。' : '支持读取和发送消息。',
              child: Column(
                children: [
                  Expanded(
                    child: _chatLoading
                        ? const Center(child: CircularProgressIndicator())
                        : ListView(
                            children: _messages
                                .map(
                                  (message) => Align(
                                    alignment: message.senderName == '当前用户'
                                        ? Alignment.centerRight
                                        : Alignment.centerLeft,
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      padding: const EdgeInsets.all(12),
                                      constraints: const BoxConstraints(maxWidth: 420),
                                      decoration: BoxDecoration(
                                        color: message.senderName == '当前用户'
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
                                  ),
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
                          enabled: _selectedConversationId != null && !_sendingMessage,
                          decoration: const InputDecoration(labelText: '输入消息'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      FilledButton(
                        onPressed: _selectedConversationId == null || _sendingMessage ? null : _sendMessage,
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
          ),
        ],
      ),
    );
  }

  Widget _buildAccount(AppUser user, SubscriptionOverview subscription) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        SectionCard(
          title: '账户信息',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('姓名：${user.name}'),
              const SizedBox(height: 8),
              Text('手机号：${user.phone}'),
              const SizedBox(height: 8),
              Text('角色：${user.role}'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SectionCard(
          title: '订阅与限制',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(subscription.planName),
              const SizedBox(height: 8),
              Text(subscription.priceLabel),
              const SizedBox(height: 8),
              Text(subscription.groupUsage),
              const SizedBox(height: 8),
              Text(subscription.documentUsage),
              const SizedBox(height: 8),
              Text(subscription.queryUsage),
            ],
          ),
        ),
      ],
    );
  }
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
