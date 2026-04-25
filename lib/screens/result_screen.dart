import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ResultScreen extends StatelessWidget {
  final String issue;
  final String result;

  const ResultScreen({super.key, required this.issue, required this.result});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('相关政策条款'),
        actions: [
          IconButton(
            icon: const Icon(Icons.copy),
            tooltip: '复制结果',
            onPressed: () {
              Clipboard.setData(ClipboardData(text: result));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('已复制到剪贴板')),
              );
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('审计问题', style: Theme.of(context).textTheme.labelMedium),
                  const SizedBox(height: 4),
                  Text(issue),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: SelectableText(result),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
