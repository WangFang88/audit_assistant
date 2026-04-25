import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/app_models.dart';

class ApiService {
  ApiService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? 'http://localhost:3000/api';

  final http.Client _client;
  final String _baseUrl;

  Future<LoginResponse> login({required String phone, required String password}) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );

    final json = _decode(response);
    return LoginResponse.fromJson(json);
  }

  Future<DashboardOverview> fetchDashboard({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/overview/dashboard').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _client.get(uri);
    final json = _decode(response);
    return DashboardOverview.fromJson(json);
  }

  Future<QueryResult> search({required String question, String? groupId}) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/query/search'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'question': question, 'groupId': groupId}),
    );

    final json = _decode(response);
    return QueryResult.fromJson(json);
  }

  Map<String, dynamic> _decode(http.Response response) {
    final body = jsonDecode(response.body) as Object?;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = body is Map<String, dynamic>
          ? (body['message']?.toString() ?? '请求失败')
          : '请求失败';
      throw ApiException(message);
    }

    if (body is! Map<String, dynamic>) {
      throw const ApiException('接口返回格式错误');
    }

    return body;
  }
}

class LoginResponse {
  const LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final AppUser user;

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
      user: AppUser.fromJson(json['user'] as Map<String, dynamic>? ?? const {}),
    );
  }
}

class ApiException implements Exception {
  const ApiException(this.message);

  final String message;

  @override
  String toString() => message;
}
