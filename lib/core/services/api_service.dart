import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'file_download_helper_stub.dart'
    if (dart.library.js_interop) 'file_download_helper_web.dart';
import 'origin_helper_stub.dart'
    if (dart.library.js_interop) 'origin_helper_web.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/app_models.dart';

class ApiService {
  ApiService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? _resolveBaseUrl();

  static String _resolveBaseUrl() {
    const configuredBaseUrl = String.fromEnvironment('API_BASE_URL');
    if (configuredBaseUrl.isNotEmpty) {
      return configuredBaseUrl;
    }
    if (kIsWeb) {
      final origin = getWebOrigin();
      if (origin.isNotEmpty && !origin.contains('localhost') && !origin.contains('127.0.0.1')) {
        return '$origin/api';
      }
      return 'http://localhost:3000/api';
    }
    // Android emulator: 10.0.2.2 maps to host machine's localhost
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }

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

    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      try {
        return AppUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
      } catch (_) {}
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

  Future<AppUser> updateProfile({required String name}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.patch(
        Uri.parse('$_baseUrl/auth/me'),
        headers: {...headers, 'Content-Type': 'application/json'},
        body: jsonEncode({'name': name}),
      ),
    );
    final json = _decodeMap(response);
    return AppUser.fromJson(json);
  }

  Future<ConversationSummary> createDirectConversation({required String targetUserId}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/chat/direct-conversations'),
        headers: {...headers, 'Content-Type': 'application/json'},
        body: jsonEncode({'targetUserId': targetUserId}),
      ),
    );
    return ConversationSummary.fromJson(_decodeMap(response));
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

  Future<QueryResult> search({required String question, String? groupId, String? agentId, String? queryScope}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/query/search'),
        headers: headers,
        body: jsonEncode({'question': question, 'groupId': groupId, 'agentId': agentId, if (queryScope != null) 'queryScope': queryScope}),
      ),
      headers: {'Content-Type': 'application/json'},
    );

    final json = _decodeMap(response);
    print('[DEBUG Frontend] similarCases count: ${(json['similarCases'] as List?)?.length ?? 0}');
    final result = QueryResult.fromJson(json);
    print('[DEBUG Frontend] QueryResult.similarCases count: ${result.similarCases.length}');
    return result;
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

  Future<Map<String, List<String>>> getLibraryRegions() async {
    final response = await _requestWithRefresh(
      (headers) => _client.get(Uri.parse('$_baseUrl/documents/library-regions'), headers: headers),
    );
    final json = _decodeMap(response);
    return json.map((k, v) => MapEntry(k, (v as List).cast<String>()));
  }

  Future<void> buyLibraryAccess({required String libraryType, String? region}) async {
    final response = await _requestWithRefresh(
      (headers) => _client.post(
        Uri.parse('$_baseUrl/subscriptions/library-access'),
        headers: headers,
        body: jsonEncode({
          'libraryType': libraryType,
          if (region != null) 'region': region,
        }),
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

  Future<void> clearConversationMessages(String conversationId) async {
    await _requestWithRefresh(
      (headers) => _client.delete(
        Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages'),
        headers: headers,
      ),
    );
  }

  Future<void> deleteMessage({
    required String conversationId,
    required String messageId,
  }) async {
    await _requestWithRefresh(
      (headers) => _client.delete(
        Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages/$messageId'),
        headers: headers,
      ),
    );
  }

  Future<void> recallMessage({
    required String conversationId,
    required String messageId,
  }) async {
    await _requestWithRefresh(
      (headers) => _client.patch(
        Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages/$messageId/recall'),
        headers: headers,
      ),
    );
  }

  Future<void> deleteDirectConversation(String conversationId) async {
    await _requestWithRefresh(
      (headers) => _client.delete(
        Uri.parse('$_baseUrl/chat/direct-conversations/$conversationId'),
        headers: headers,
      ),
    );
  }

  Uri buildFileUri(String sourcePath) {
    final normalizedPath = sourcePath.startsWith('/') ? sourcePath : '/$sourcePath';
    final apiUri = Uri.parse(_baseUrl);
    final baseSegments = List<String>.from(apiUri.pathSegments);
    if (baseSegments.isNotEmpty && baseSegments.last == 'api') {
      baseSegments.removeLast();
    }
    final fullSegments = <String>[
      ...baseSegments.where((segment) => segment.isNotEmpty),
      ...normalizedPath.split('/').where((segment) => segment.isNotEmpty),
    ];
    return apiUri.replace(pathSegments: fullSegments, queryParameters: null);
  }

  Future<void> openFilePath(String sourcePath) async {
    if (!sourcePath.startsWith('/')) {
      await _openLocalFile(sourcePath);
      return;
    }
    final uri = buildFileUri(sourcePath);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw ApiException('无法打开文件：$sourcePath');
    }
  }

  Future<void> _openLocalFile(String filePath) async {
    if (Platform.isWindows) {
      final result = await Process.run('explorer.exe', [filePath]);
      if (result.exitCode == 0) {
        return;
      }
      final fallback = await Process.run('cmd', ['/c', 'start', '', filePath]);
      if (fallback.exitCode == 0) {
        return;
      }
      throw ApiException('无法打开文件：$filePath');
    }
    if (Platform.isMacOS) {
      final result = await Process.run('open', [filePath]);
      if (result.exitCode != 0) {
        throw ApiException('无法打开文件：$filePath');
      }
      return;
    }
    if (Platform.isLinux) {
      final result = await Process.run('xdg-open', [filePath]);
      if (result.exitCode != 0) {
        throw ApiException('无法打开文件：$filePath');
      }
      return;
    }
    final uri = Uri.file(filePath);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw ApiException('无法打开文件：$filePath');
    }
  }

  Future<String?> downloadChatMessageFile({
    required String conversationId,
    required String messageId,
    required String fileName,
  }) async {
    final response = await _requestWithRefresh(
      (headers) => _client.get(
        Uri.parse('$_baseUrl/chat/conversations/$conversationId/messages/$messageId/file'),
        headers: headers,
      ),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException('文件下载失败：$fileName (${response.statusCode})');
    }

    final mimeType = response.headers['content-type'] ?? 'application/octet-stream';
    if (kIsWeb) {
      await saveBytesAsDownload(response.bodyBytes, fileName, mimeType);
      return null;
    }

    final pickedDirectory = await FilePicker.platform.getDirectoryPath(dialogTitle: '选择保存位置');
    if (pickedDirectory == null || pickedDirectory.isEmpty) {
      throw ApiException('已取消保存文件');
    }

    final file = File('$pickedDirectory/$fileName');
    await file.writeAsBytes(response.bodyBytes, flush: true);
    return file.path;
  }

  Future<ChatMessage> sendMessage({
    required String conversationId,
    required String conversationType,
    String? content,
    PlatformFile? file,
    String? groupId,
    void Function(double progress)? onSendProgress,
  }) async {
    final response = await _multipartRequestWithRefresh((headers) async {
      final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/chat/messages'));
      request.headers.addAll(headers);
      request.fields['conversationId'] = conversationId;
      request.fields['conversationType'] = conversationType;
      if (content != null && content.trim().isNotEmpty) {
        request.fields['content'] = content.trim();
      }
      if (groupId != null && groupId.isNotEmpty) {
        request.fields['groupId'] = groupId;
      }
      if (file != null) {
        request.files.add(await _buildMultipartFile(file, onProgress: onSendProgress));
      }
      return request;
    });

    onSendProgress?.call(1);
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
    String? region,
    String? rawText,
    String? groupId,
  }) async {
    final response = await _multipartRequestWithRefresh((headers) async {
      final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/documents/import'));
      request.headers.addAll(headers);
      request.fields['title'] = title;
      request.fields['libraryType'] = libraryType;
      if (region != null && region.isNotEmpty) {
        request.fields['region'] = region;
      }
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

  Future<void> deleteDocument({required String documentId}) async {
    await _requestWithRefresh(
      (headers) => _client.delete(
        Uri.parse('$_baseUrl/documents/$documentId'),
        headers: headers,
      ),
    );
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

  Future<http.MultipartFile> _buildMultipartFile(
    PlatformFile file, {
    void Function(double progress)? onProgress,
  }) async {
    final fileName = file.name.trim().isEmpty ? 'upload.bin' : file.name;
    final fileBytes = file.bytes;
    if (fileBytes != null) {
      onProgress?.call(0.2);
      return http.MultipartFile.fromBytes('file', fileBytes, filename: fileName);
    }

    final filePath = file.path;
    if (filePath == null || filePath.isEmpty) {
      throw const ApiException('未获取到上传文件内容');
    }

    onProgress?.call(0.2);
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
