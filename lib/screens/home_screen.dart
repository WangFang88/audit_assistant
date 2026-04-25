import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/claude_service.dart';
import 'result_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _issueController = TextEditingController();
  final _apiKeyController = TextEditingController();
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadApiKey();
  }

  Future<void> _loadApiKey() async {
    final prefs = await SharedPreferences.getInstance();
    _apiKeyController.text = prefs.getString('api_key') ?? '';
  }

  Future<void> _saveApiKey(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_key', key);
  }

  Future<void> _search() async {
    final issue = _issueController.text.trim();
    final apiKey = _apiKeyController.text.trim();
    if (issue.isEmpty || apiKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请填写审计问题和API Key')),
      );
      return;
    }
    await _saveApiKey(apiKey);
    setState(() => _loading = true);
    try {
      final result = await ClaudeService(apiKey).findPolicyArticles(issue);
      if (!mounted) return;
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => ResultScreen(issue: issue, result: result),
      ));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('查询失败: $e')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('审计助手'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _apiKeyController,
              decoration: const InputDecoration(
                labelText: 'Anthropic API Key',
                border: OutlineInputBorder(),
                hintText: 'sk-ant-...',
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            Expanded(
              child: TextField(
                controller: _issueController,
                decoration: const InputDecoration(
                  labelText: '审计发现的问题',
                  border: OutlineInputBorder(),
                  hintText: '请详细描述审计中发现的问题...',
                  alignLabelWithHint: true,
                ),
                maxLines: null,
                expands: true,
                textAlignVertical: TextAlignVertical.top,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _search,
              child: _loading
                  ? const SizedBox(
                      height: 20, width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('查找相关政策条款'),
            ),
          ],
        ),
      ),
    );
  }
}
