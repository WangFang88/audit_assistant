import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';

class MobileGroupsPage extends StatefulWidget {
  const MobileGroupsPage({super.key, required this.apiService, required this.user});
  final ApiService apiService;
  final AppUser user;

  @override
  State<MobileGroupsPage> createState() => _MobileGroupsPageState();
}

class _MobileGroupsPageState extends State<MobileGroupsPage> {
  bool _loading = true;
  List<ProjectGroup> _groups = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final overview = await widget.apiService.fetchDashboard();
      if (!mounted) return;
      setState(() => _groups = overview.groups);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showCreateDialog() async {
    final nameCtrl = TextEditingController();
    final orgCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('创建项目组'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: '项目组名称', isDense: true)),
          const SizedBox(height: 12),
          TextField(controller: orgCtrl, decoration: const InputDecoration(labelText: '所属单位', isDense: true)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('创建')),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await widget.apiService.createGroup(name: nameCtrl.text.trim(), organizationName: orgCtrl.text.trim());
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('创建失败：$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      body: _groups.isEmpty
          ? const Center(child: Text('暂无项目组，点击右下角创建'))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: _groups.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) => _GroupCard(
                  group: _groups[i],
                  apiService: widget.apiService,
                  currentUser: widget.user,
                  onChanged: _load,
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'groups_fab',
        onPressed: _showCreateDialog,
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _GroupCard extends StatelessWidget {
  const _GroupCard({required this.group, required this.apiService, required this.currentUser, required this.onChanged});
  final ProjectGroup group;
  final ApiService apiService;
  final AppUser currentUser;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => _GroupDetailPage(group: group, apiService: apiService, currentUser: currentUser, onChanged: onChanged)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(group.name, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600))),
              Icon(Icons.chevron_right, color: theme.colorScheme.outline, size: 18),
            ]),
            const SizedBox(height: 4),
            Text(group.organizationName, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
            const SizedBox(height: 8),
            Row(children: [
              _Chip(Icons.people_outline, '${group.memberCount} 人'),
              const SizedBox(width: 8),
              _Chip(Icons.folder_outlined, '${group.privateDocumentCount} 文件'),
            ]),
          ]),
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.icon, this.label);
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 13, color: theme.colorScheme.outline),
      const SizedBox(width: 3),
      Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
    ]);
  }
}

// ── Group detail page ──────────────────────────────────────────────────────

class _GroupDetailPage extends StatefulWidget {
  const _GroupDetailPage({required this.group, required this.apiService, required this.currentUser, required this.onChanged});
  final ProjectGroup group;
  final ApiService apiService;
  final AppUser currentUser;
  final VoidCallback onChanged;

  @override
  State<_GroupDetailPage> createState() => _GroupDetailPageState();
}

class _GroupDetailPageState extends State<_GroupDetailPage> {
  bool _loading = true;
  List<GroupMember> _members = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final members = await widget.apiService.fetchMembers(widget.group.id);
      if (!mounted) return;
      setState(() => _members = members);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  GroupMember? get _myMembership =>
      _members.where((m) => m.userId == widget.currentUser.id).firstOrNull;

  bool get _isLeader => _myMembership?.role == '组长';
  bool get _isAdmin => widget.currentUser.role == 'admin' || widget.currentUser.role == '管理员';

  Future<void> _showInviteDialog() async {
    final phoneCtrl = TextEditingController();
    String role = '成员';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, set) => AlertDialog(
          title: const Text('邀请成员'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: phoneCtrl, keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: '手机号', isDense: true)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: role,
              decoration: const InputDecoration(labelText: '角色', isDense: true),
              items: const [
                DropdownMenuItem(value: '成员', child: Text('成员')),
              ],
              onChanged: (v) => set(() => role = v!),
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('邀请')),
          ],
        ),
      ),
    );
    if (confirmed != true) return;
    try {
      await widget.apiService.inviteMember(groupId: widget.group.id, phone: phoneCtrl.text.trim(), role: role);
      await _load();
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('邀请成功')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('邀请失败：$e')));
    }
  }

  Future<void> _removeMember(GroupMember m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('移除成员'),
        content: Text('确定移除 ${m.name}？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('移除')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await widget.apiService.removeMember(groupId: widget.group.id, memberId: m.id);
      await _load();
      widget.onChanged();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('操作失败：$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final canInvite = _isLeader || _isAdmin;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.group.name),
        actions: [
          if (canInvite)
            IconButton(icon: const Icon(Icons.person_add_outlined), tooltip: '邀请成员', onPressed: _showInviteDialog),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  // Info card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('项目组信息', style: theme.textTheme.titleSmall),
                        const SizedBox(height: 8),
                        _InfoRow('所属单位', widget.group.organizationName),
                        _InfoRow('成员数量', '${widget.group.memberCount} 人'),
                        _InfoRow('私有文件', '${widget.group.privateDocumentCount} 个'),
                        _InfoRow('最近查询', widget.group.lastQueryAt),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Members
                  Text('成员列表', style: theme.textTheme.titleSmall),
                  const SizedBox(height: 8),
                  ..._members.map((m) {
                    final isMe = m.userId == widget.currentUser.id;
                    final canRemove = (_isLeader || _isAdmin) && !isMe && m.role != '组长';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          radius: 18,
                          backgroundColor: theme.colorScheme.primaryContainer,
                          child: Text(m.name.isNotEmpty ? m.name[0] : '?',
                              style: TextStyle(fontSize: 13, color: theme.colorScheme.onPrimaryContainer)),
                        ),
                        title: Text('${m.name}${isMe ? " (我)" : ""}', style: const TextStyle(fontSize: 14)),
                        subtitle: Text(m.phone, style: theme.textTheme.bodySmall),
                        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: m.role == '组长' ? theme.colorScheme.primaryContainer : theme.colorScheme.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(m.role, style: TextStyle(fontSize: 11,
                                color: m.role == '组长' ? theme.colorScheme.onPrimaryContainer : theme.colorScheme.onSurface)),
                          ),
                          if (canRemove) ...[
                            const SizedBox(width: 4),
                            IconButton(
                              icon: Icon(Icons.remove_circle_outline, size: 18, color: theme.colorScheme.error),
                              onPressed: () => _removeMember(m),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ]),
                      ),
                    );
                  }),
                ],
              ),
            ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
        Text(value, style: theme.textTheme.bodySmall),
      ]),
    );
  }
}
