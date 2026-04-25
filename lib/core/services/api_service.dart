import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_models.dart';

class ApiService {
  ApiService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? 'http://localhost:3000/api';

  static const _accessTokenKey = 'auth.accessToken';
  static const _refreshTokenKey = 'auth.refreshToken';
  static const _userKey = 'auth.user';

  VoidCallback? onUnauthorized;

  final http.Client _client;
  final String _baseUrl;

  Future<void> persistLogin(LoginResponse loginResponse) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, loginResponse.accessToken);
    await prefs.setString(_refreshTokenKey, loginResponse.refreshToken);
    await prefs.setString(_userKey, jsonEncode(loginResponse.user.toJson()));
  }

  Future<AppUser?> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final accessToken = prefs.getString(_accessTokenKey);
    final refreshToken = prefs.getString(_refreshTokenKey);
    final userJson = prefs.getString(_userKey);

    if (accessToken == null || accessToken.isEmpty || refreshToken == null || refreshToken.isEmpty) {
      return null;
    }

    if (userJson == null || userJson.isEmpty) {
      return null;
    }

    final decoded = jsonDecode(userJson) as Object?;
    if (decoded is! Map<String, dynamic>) {
      return null;
    }

    return AppUser.fromJson(decoded);
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userKey);
  }

  Future<LoginResponse> login({required String phone, required String password}) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );

    final json = _decodeMap(response);
    return LoginResponse.fromJson(json);
  }

  Future<DashboardOverview> fetchDashboard({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/overview/dashboard').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _client.get(uri);
    final json = _decodeMap(response);
    return DashboardOverview.fromJson(json);
  }

  Future<QueryResult> search({required String question, String? groupId}) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/query/search'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'question': question, 'groupId': groupId}),
    );

    final json = _decodeMap(response);
    return QueryResult.fromJson(json);
  }

  Future<List<ConversationSummary>> fetchConversations({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/chat/conversations').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _client.get(uri);
    final list = _decodeList(response);
    return list.map(ConversationSummary.fromJson).toList();
  }

  Future<List<ChatMessage>> fetchMessages(String conversationId) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages'),
    );
    final list = _decodeList(response);
    return list.map(ChatMessage.fromJson).toList();
  }

  Future<ChatMessage> sendMessage({
    required String conversationId,
    required String conversationType,
    required String content,
    String? groupId,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/chat/messages'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'conversationId': conversationId,
        'conversationType': conversationType,
        'content': content,
        'groupId': groupId,
      }),
    );

    final json = _decodeMap(response);
    return ChatMessage.fromJson(json);
  }

  Future<List<GroupMember>> fetchMembers(String groupId) async {
    final response = await _client.get(Uri.parse('$_baseUrl/groups/$groupId/members'));
    final list = _decodeList(response);
    return list.map(GroupMember.fromJson).toList();
  }

  Future<ProjectGroup> createGroup({required String name, required String organizationName}) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/groups'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'organizationName': organizationName}),
    );

    final json = _decodeMap(response);
    return ProjectGroup.fromJson(json);
  }

  Future<List<KnowledgeDocument>> fetchDocuments({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/documents').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _client.get(uri);
    final list = _decodeList(response);
    return list.map(KnowledgeDocument.fromJson).toList();
  }

  Future<List<ExtractionJob>> fetchExtractionJobs({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/documents/extract-jobs').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _client.get(uri);
    final list = _decodeList(response);
    return list.map(ExtractionJob.fromJson).toList();
  }

  Future<ImportDocumentResult> importDocument({
    required String title,
    required String libraryType,
    required String sourcePath,
    String? groupId,
  }) async {
    final backendLibraryType = libraryType == '公共库' ? 'public' : 'private';
    final response = await _client.post(
      Uri.parse('$_baseUrl/documents/import-from-file-server'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'title': title,
        'libraryType': backendLibraryType,
        'sourcePath': sourcePath,
        'groupId': groupId,
      }),
    );

    final json = _decodeMap(response);
    return ImportDocumentResult.fromJson(json);
  }

  Future<void> inviteMember({
    required String groupId,
    required String phone,
    required String role,
  }) async {
    final backendRole = role == '组长' ? 'leader' : 'member';
    final response = await _client.post(
      Uri.parse('$_baseUrl/groups/$groupId/invites'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'role': backendRole}),
    );

    _decodeMap(response);
  }

  Future<void> transferLeader({
    required String groupId,
    required String targetUserId,
  }) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/groups/$groupId/transfer-leader'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'targetUserId': targetUserId}),
    );

    _decodeMap(response);
  }

  Future<void> removeMember({required String groupId, required String memberId}) async {
    final response = await _client.delete(Uri.parse('$_baseUrl/groups/$groupId/members/$memberId'));
    _decodeMap(response);
  }

  Map<String, dynamic> _decodeMap(http.Response response) {
    final body = jsonDecode(response.body) as Object?;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = body is Map<String, dynamic>
          ? (body['message']?.toString() ?? '请求失败')
          : '请求失败';
      _handleUnauthorized(response.statusCode);
      throw ApiException(message);
    }

    if (body is! Map<String, dynamic>) {
      throw const ApiException('接口返回格式错误');
    }

    return body;
  }

  List<Map<String, dynamic>> _decodeList(http.Response response) {
    final body = jsonDecode(response.body) as Object?;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = body is Map<String, dynamic>
          ? (body['message']?.toString() ?? '请求失败')
          : '请求失败';
      _handleUnauthorized(response.statusCode);
      throw ApiException(message);
    }

    if (body is! List) {
      throw const ApiException('接口返回格式错误');
    }

    return body.whereType<Map<String, dynamic>>().toList();
  }

  void _handleUnauthorized(int statusCode) {
    if (statusCode == 401 || statusCode == 403) {
      clearSession();
      onUnauthorized?.call();
    }
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
