import 'package:flutter/material.dart';

class ResultScreen extends StatelessWidget {
  const ResultScreen({
    super.key,
    required this.issue,
    required this.result,
  });

  final String issue;
  final String result;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('结构化查询结果')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('检索问题', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(issue),
            const SizedBox(height: 24),
            Text('结果摘要', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Expanded(child: SingleChildScrollView(child: SelectableText(result))),
          ],
        ),
      ),
    );
  }
}
