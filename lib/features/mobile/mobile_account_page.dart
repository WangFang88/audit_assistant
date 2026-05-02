import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';

class MobileAccountPage extends StatefulWidget {
  const MobileAccountPage({
    super.key,
    required this.apiService,
    required this.user,
    required this.onLogout,
  });
  final ApiService apiService;
  final AppUser user;
  final VoidCallback onLogout;

  @override
  State<MobileAccountPage> createState() => _MobileAccountPageState();
}

class _MobileAccountPageState extends State<MobileAccountPage> {
  bool _loading = true;
  SubscriptionOverview? _subscription;

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
      setState(() => _subscription = overview.subscription);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('退出登录'),
        content: const Text('确定要退出登录吗？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('退出')),
        ],
      ),
    );
    if (confirmed == true) widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = widget.user;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Profile card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Text(
                  user.name.isNotEmpty ? user.name[0] : '?',
                  style: TextStyle(fontSize: 22, color: theme.colorScheme.onPrimaryContainer),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(user.phone, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(user.role, style: TextStyle(fontSize: 11, color: theme.colorScheme.onPrimaryContainer)),
                ),
              ])),
            ]),
          ),
        ),
        const SizedBox(height: 12),
        // Subscription
        if (_loading)
          const Card(child: Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())))
        else if (_subscription != null)
          _SubscriptionCard(subscription: _subscription!),
        const SizedBox(height: 12),
        // Actions
        Card(
          child: Column(children: [
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('退出登录'),
              onTap: _logout,
              textColor: theme.colorScheme.error,
              iconColor: theme.colorScheme.error,
            ),
          ]),
        ),
      ],
    );
  }
}

class _SubscriptionCard extends StatelessWidget {
  const _SubscriptionCard({required this.subscription});
  final SubscriptionOverview subscription;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = subscription;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('套餐信息', style: theme.textTheme.titleSmall),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(s.planName, style: TextStyle(fontSize: 11, color: theme.colorScheme.onPrimaryContainer)),
            ),
          ]),
          const SizedBox(height: 12),
          _InfoRow(label: '状态', value: s.statusLabel),
          if (s.effectiveOrder != null) _InfoRow(label: '到期时间', value: s.effectiveOrder!.expiredAt),
          _InfoRow(label: '今日查询', value: s.queryUsage),
          _InfoRow(label: '私有文件', value: s.documentUsage),
          _InfoRow(label: '项目组', value: s.groupUsage),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
        Text(value, style: theme.textTheme.bodySmall),
      ]),
    );
  }
}
