import 'package:flutter/material.dart';

class PaymentPage extends StatefulWidget {
  const PaymentPage({super.key, required this.planId, required this.planLabel, required this.price, required this.duration, required this.onPaid, required this.onCancel});

  final String planId;
  final String planLabel;
  final String price;
  final String duration;
  final VoidCallback onPaid;
  final VoidCallback onCancel;

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  String _payMethod = 'alipay';
  bool _paying = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('收银台'), leading: IconButton(icon: const Icon(Icons.close), onPressed: widget.onCancel)),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 订单信息
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('订单信息', style: theme.textTheme.titleMedium),
                        const Divider(height: 24),
                        _OrderRow(label: '商品名称', value: '小嘉审计助手 ${widget.planLabel}'),
                        const SizedBox(height: 8),
                        _OrderRow(label: '有效期', value: widget.duration),
                        const SizedBox(height: 8),
                        _OrderRow(label: '订单金额', value: widget.price, valueStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 支付方式
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('支付方式', style: theme.textTheme.titleMedium),
                        const Divider(height: 24),
                        _PayMethodTile(
                          value: 'alipay',
                          selected: _payMethod == 'alipay',
                          icon: Icons.account_balance_wallet_outlined,
                          color: const Color(0xFF1677FF),
                          label: '支付宝',
                          onTap: () => setState(() => _payMethod = 'alipay'),
                        ),
                        const SizedBox(height: 8),
                        _PayMethodTile(
                          value: 'wechat',
                          selected: _payMethod == 'wechat',
                          icon: Icons.chat_bubble_outline,
                          color: const Color(0xFF07C160),
                          label: '微信支付',
                          onTap: () => setState(() => _payMethod = 'wechat'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // 支付按钮
                FilledButton(
                  onPressed: _paying ? null : _pay,
                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: _paying
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('立即支付 ${widget.price}', style: const TextStyle(fontSize: 16)),
                ),
                const SizedBox(height: 12),
                Text('支付即表示同意《服务协议》，支付成功后订阅立即生效。', style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pay() async {
    setState(() => _paying = true);
    // TODO: 调用后端创建支付订单，获取支付宝/微信支付跳转 URL
    await Future.delayed(const Duration(seconds: 1));
    if (!mounted) return;
    setState(() => _paying = false);
    widget.onPaid();
  }
}

class _OrderRow extends StatelessWidget {
  const _OrderRow({required this.label, required this.value, this.valueStyle});
  final String label;
  final String value;
  final TextStyle? valueStyle;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey[600])),
        Text(value, style: valueStyle ?? Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}

class _PayMethodTile extends StatelessWidget {
  const _PayMethodTile({required this.value, required this.selected, required this.icon, required this.color, required this.label, required this.onTap});
  final String value;
  final bool selected;
  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: selected ? Theme.of(context).colorScheme.primary : Colors.grey[300]!, width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w500))),
            Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                color: selected ? Theme.of(context).colorScheme.primary : Colors.grey),
          ],
        ),
      ),
    );
  }
}
