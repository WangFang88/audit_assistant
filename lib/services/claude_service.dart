import 'dart:convert';
import 'package:http/http.dart' as http;

class ClaudeService {
  final String apiKey;
  static const _url = 'https://api.anthropic.com/v1/messages';

  ClaudeService(this.apiKey);

  Future<String> findPolicyArticles(String issue) async {
    final response = await http.post(
      Uri.parse(_url),
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: jsonEncode({
        'model': 'claude-sonnet-4-6',
        'max_tokens': 2048,
        'messages': [
          {
            'role': 'user',
            'content': '''你是一位专业的审计法律顾问。请根据以下审计发现的问题，查找并列出相关的政策法规条款来印证该问题。

审计发现的问题：
$issue

请按以下格式输出：
1. 相关法规名称
2. 具体条款内容
3. 条款与问题的关联说明

请尽量引用准确的法规条款。'''
          }
        ],
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      return data['content'][0]['text'] as String;
    } else {
      throw Exception('API请求失败: ${response.statusCode} ${response.body}');
    }
  }
}
