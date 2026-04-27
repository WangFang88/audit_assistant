import 'dart:convert';

import 'package:file_picker/file_picker.dart';
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
  Future<void>? _refreshingSession;

  final http.Client _client;
  final String _baseUrl;

  Future<void> persistLogin(LoginResponse loginResponse) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, loginResponse.accessToken);
    await prefs.setString(_refreshTokenKey, loginResponse.refreshToken);
    await prefs.setString(_userKey, jsonEncode(loginResponse.user.toJson()));
  }

  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_refreshTokenKey);
    if (token == null || token.isEmpty) {
      return null;
    }
    return token;
  }

  Future<AppUser?> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final accessToken = prefs.getString(_accessTokenKey);
    final refreshToken = prefs.getString(_refreshTokenKey);

    if (accessToken == null || accessToken.isEmpty || refreshToken == null || refreshToken.isEmpty) {
      return null;
    }

    return fetchCurrentUser();
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userKey);
  }

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_accessTokenKey);
    if (token == null || token.isEmpty) {
      return null;
    }
    return token;
  }

  Future<Map<String, String>> _authorizedHeaders({Map<String, String>? headers}) async {
    final merged = <String, String>{...?headers};
    final token = await getAccessToken();
    if (token != null) {
      merged['Authorization'] = 'Bearer $token';
    }
    return merged;
  }

  Future<http.Response> _requestWithRefresh(
    Future<http.Response> Function(Map<String, String> headers) send, {
    Map<String, String>? headers,
  }) async {
    var authorizedHeaders = await _authorizedHeaders(headers: headers);
    var response = await send(authorizedHeaders);

    if (response.statusCode != 401 && response.statusCode != 403) {
      return response;
    }

    final refreshed = await _refreshAccessToken();
    if (!refreshed) {
      return response;
    }

    authorizedHeaders = await _authorizedHeaders(headers: headers);
    return send(authorizedHeaders);
  }

  Future<http.Response> _multipartRequestWithRefresh(
    Future<http.MultipartRequest> Function(Map<String, String> headers) build,
  ) async {
    var request = await build(await _authorizedHeaders());
    var streamedResponse = await _client.send(request);
    var response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 401 && response.statusCode != 403) {
      return response;
    }

    final refreshed = await _refreshAccessToken();
    if (!refreshed) {
      return response;
    }

    request = await build(await _authorizedHeaders());
    streamedResponse = await _client.send(request);
    return http.Response.fromStream(streamedResponse);
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

  Future<LoginResponse> register({required String phone, required String password}) async {
    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );

    final json = _decodeMap(response);
    return LoginResponse.fromJson(json);
  }

  Future<AppUser> fetchCurrentUser() async {
    final response = await _requestWithRefresh(
      (headers) => _client.get(
        Uri.parse('$_baseUrl/auth/me'),
        headers: headers,
      ),
    );
    final json = _decodeMap(response);
    final user = AppUser.fromJson(json);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    return user;
  }

  Future<DashboardOverview> fetchDashboard({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/overview/dashboard').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _requestWithRefresh(
      (headers) => _client.get(uri, headers: headers),
    );
    final json = _decodeMap(response);
    return DashboardOverview.fromJson(json);
  }

  Future<QueryResult> search({required String question, String? groupId, String? agentId}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/query/search'),
        headers: headers,
        body: jsonEncode({'question': question, 'groupId': groupId, 'agentId': agentId}),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    final json = _decodeMap(response);
    return QueryResult.fromJson(json);
  }

  Future<void> createSubscriptionOrder({required String planType}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/subscriptions/orders'),
        headers: headers,
        body: jsonEncode({'planType': planType}),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    _decodeMap(response);
  }

  Future<List<ConversationSummary>> fetchConversations({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/chat/conversations').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _requestWithRefresh(
      (headers) => _client.get(uri, headers: headers),
    );
    final list = _decodeList(response);
    return list.map(ConversationSummary.fromJson).toList();
  }

  Future<List<ChatMessage>> fetchMessages(String conversationId) async {
    final response = await _requestWithRefresh(
      (headers) => _client.get(
        Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages'),
        headers: headers,
      ),
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
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/chat/messages'),
        headers: headers,
        body: jsonEncode({
          'conversationId': conversationId,
          'conversationType': conversationType,
          'content': content,
          'groupId': groupId,
        }),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    final json = _decodeMap(response);
    return ChatMessage.fromJson(json);
  }

  Future<List<GroupMember>> fetchMembers(String groupId) async {
    final response = await _requestWithRefresh(
      (headers) => _client.get(
        Uri.parse('$_baseUrl/groups/$groupId/members'),
        headers: headers,
      ),
    );
    final list = _decodeList(response);
    return list.map(GroupMember.fromJson).toList();
  }

  Future<ProjectGroup> createGroup({required String name, required String organizationName}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/groups'),
        headers: headers,
        body: jsonEncode({'name': name, 'organizationName': organizationName}),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    final json = _decodeMap(response);
    return ProjectGroup.fromJson(json);
  }

  Future<List<KnowledgeDocument>> fetchDocuments({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/documents').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _requestWithRefresh(
      (headers) => _client.get(uri, headers: headers),
    );
    final list = _decodeList(response);
    return list.map(KnowledgeDocument.fromJson).toList();
  }

  Future<List<ExtractionJob>> fetchExtractionJobs({String? groupId}) async {
    final uri = Uri.parse('$_baseUrl/documents/extract-jobs').replace(
      queryParameters: groupId == null ? null : {'groupId': groupId},
    );
    final response = await _requestWithRefresh(
      (headers) => _client.get(uri, headers: headers),
    );
    final list = _decodeList(response);
    return list.map(ExtractionJob.fromJson).toList();
  }

  Future<List<DocumentChunkPreview>> fetchDocumentChunks(String documentId) async {
    final response = await _requestWithRefresh(
      (headers) => _client.get(Uri.parse('$_baseUrl/documents/$documentId/chunks'), headers: headers),
    );
    final list = _decodeList(response);
    return list.map(DocumentChunkPreview.fromJson).toList();
  }

  Future<ImportDocumentResult> importDocument({
    required String title,
    required String libraryType,
    required PlatformFile file,
    String? rawText,
    String? groupId,
  }) async {
    final backendLibraryType = libraryType == '公共库' ? 'public' : 'private';
    final response = await _multipartRequestWithRefresh((headers) async {
      final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/documents/import'));
      request.headers.addAll(headers);
      request.fields['title'] = title;
      request.fields['libraryType'] = backendLibraryType;
      if (rawText != null && rawText.isNotEmpty) {
        request.fields['rawText'] = rawText;
      }
      if (groupId != null && groupId.isNotEmpty) {
        request.fields['groupId'] = groupId;
      }
      request.files.add(await _buildMultipartFile(file));
      return request;
    });

    final json = _decodeMap(response);
    return ImportDocumentResult.fromJson(json);
  }

  Future<void> inviteMember({
    required String groupId,
    required String phone,
    required String role,
  }) async {
    final backendRole = role == '组长' ? 'leader' : 'member';
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/groups/$groupId/invites'),
        headers: headers,
        body: jsonEncode({'phone': phone, 'role': backendRole}),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    _decodeMap(response);
  }

  Future<void> transferLeader({
    required String groupId,
    required String targetUserId,
  }) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/groups/$groupId/transfer-leader'),
        headers: headers,
        body: jsonEncode({'targetUserId': targetUserId}),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    _decodeMap(response);
  }

  Future<void> removeMember({required String groupId, required String memberId}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.delete(
        Uri.parse('$_baseUrl/groups/$groupId/members/$memberId'),
        headers: headers,
      ),
    );
    _decodeMap(response);
  }

  Future<void> deleteGroup({required String groupId}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.delete(
        Uri.parse('$_baseUrl/groups/$groupId'),
        headers: headers,
      ),
    );
    _decodeMap(response);
  }

  Future<void> _refreshSession() async {
    final refreshToken = await getRefreshToken();
    if (refreshToken == null) {
      throw const ApiException('缺少 refresh token');
    }

    final response = await _client.post(
      Uri.parse('$_baseUrl/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );

    final json = _decodeMap(response);
    await persistLogin(LoginResponse.fromJson(json));
  }

  Future<bool> _refreshAccessToken() async {
    _refreshingSession ??= _refreshSession().whenComplete(() {
      _refreshingSession = null;
    });

    try {
      await _refreshingSession;
      return true;
    } on ApiException {
      await clearSession();
      onUnauthorized?.call();
      return false;
    }
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

  Future<http.MultipartFile> _buildMultipartFile(PlatformFile file) async {
    final fileName = file.name.trim().isEmpty ? 'upload.bin' : file.name;
    final fileBytes = file.bytes;
    if (fileBytes != null) {
      return http.MultipartFile.fromBytes('file', fileBytes, filename: fileName);
    }

    final filePath = file.path;
    if (filePath == null || filePath.isEmpty) {
      throw const ApiException('未获取到上传文件内容');
    }

    return http.MultipartFile.fromPath('file', filePath, filename: fileName);
  }

  void _handleUnauthorized(int statusCode) {
    if (statusCode == 401) {
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
