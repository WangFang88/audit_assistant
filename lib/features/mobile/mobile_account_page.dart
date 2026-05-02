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
        else if (_subscription != null) ...[
          _SubscriptionCard(subscription: _subscription!),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(
                builder: (_) => _PurchasePage(apiService: widget.apiService, subscription: _subscription!),
              ));
              _load(); // refresh after returning
            },
            icon: const Icon(Icons.shopping_cart_outlined),
            label: const Text('购买套餐'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
          ),
        ],
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

// ── Purchase page ─────────────────────────────────────────────────────────

class _PurchasePage extends StatefulWidget {
  const _PurchasePage({required this.apiService, required this.subscription});
  final ApiService apiService;
  final SubscriptionOverview subscription;

  @override
  State<_PurchasePage> createState() => _PurchasePageState();
}

class _PurchasePageState extends State<_PurchasePage> {
  String _selected = 'monthly';
  bool _buying = false;

  static const _plans = [
    (id: 'weekly',  label: '周订阅',  duration: '7 天',   recommended: false),
    (id: 'monthly', label: '月订阅',  duration: '30 天',  recommended: true),
    (id: 'yearly',  label: '年订阅',  duration: '365 天', recommended: false),
  ];

  String _price(String id) {
    final s = widget.subscription;
    return switch (id) {
      'weekly'  => s.weeklyPrice,
      'monthly' => s.monthlyPrice,
      'yearly'  => s.yearlyPrice,
      _         => '--',
    };
  }

  Future<void> _buy() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('确认购买'),
        content: Text('确定购买 ${_plans.firstWhere((p) => p.id == _selected).label}（${_price(_selected)}）？'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('确认')),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _buying = true);
    try {
      await widget.apiService.createSubscriptionOrder(planType: _selected);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('订阅成功！')));
      Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('购买失败：$e')));
    } finally {
      if (mounted) setState(() => _buying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = widget.subscription;
    return Scaffold(
      appBar: AppBar(title: const Text('购买套餐')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Current status
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(children: [
                Icon(Icons.info_outline, size: 18, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(child: Text('当前：${s.planName} · ${s.statusLabel}', style: theme.textTheme.bodySmall)),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          Text('选择套餐', style: theme.textTheme.titleSmall),
          const SizedBox(height: 10),
          // Plan cards
          ..._plans.map((plan) {
            final isSelected = _selected == plan.id;
            return GestureDetector(
              onTap: () => setState(() => _selected = plan.id),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isSelected ? theme.colorScheme.primary : theme.colorScheme.outlineVariant,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  color: isSelected ? theme.colorScheme.primaryContainer.withValues(alpha: 0.3) : null,
                ),
                child: Row(children: [
                  Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                      color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.outline),
                  const SizedBox(width: 8),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text(plan.label, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                      if (plan.recommended) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(4)),
                          child: Text('推荐', style: TextStyle(fontSize: 10, color: theme.colorScheme.onPrimary)),
                        ),
                      ],
                    ]),
                    Text(plan.duration, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.outline)),
                  ])),
                  Text(_price(plan.id), style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
                ]),
              ),
            );
          }),
          const SizedBox(height: 8),
          // Highlights
          if (s.planHighlights.isNotEmpty) ...[
            Text('套餐权益', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            ...s.planHighlights.map((h) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(children: [
                Icon(Icons.check_circle_outline, size: 16, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(h, style: theme.textTheme.bodySmall)),
              ]),
            )),
            const SizedBox(height: 16),
          ],
          FilledButton(
            onPressed: _buying ? null : _buy,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: _buying
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text('立即购买 ${_price(_selected)}'),
          ),
        ],
      ),
    );
  }
}
