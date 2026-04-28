import 'package:flutter/material.dart';

import '../core/models/app_models.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/login_page.dart';
import '../features/dashboard/dashboard_page.dart';

class AuditAssistantApp extends StatefulWidget {
  const AuditAssistantApp({super.key});

  @override
  State<AuditAssistantApp> createState() => _AuditAssistantAppState();
}

class _AuditAssistantAppState extends State<AuditAssistantApp> {
  final ApiService _apiService = ApiService();
  AppUser? _currentUser;
  bool _restoringSession = true;

  @override
  void initState() {
    super.initState();
    _apiService.onUnauthorized = _handleSessionExpired;
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    AppUser? user;
    try {
      user = await _apiService.restoreSession();
    } catch (_) {
      user = null;
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _currentUser = user;
      _restoringSession = false;
    });
  }

  Future<void> _handleLogin(LoginResponse loginResponse) async {
    await _apiService.persistLogin(loginResponse);
    if (!mounted) {
      return;
    }

    setState(() {
      _currentUser = loginResponse.user;
    });
  }

  void _handleSessionExpired() {
    if (!mounted) {
      return;
    }

    setState(() {
      _currentUser = null;
      _restoringSession = false;
    });
  }

  Future<void> _handleLogout() async {
    await _apiService.clearSession();
    if (!mounted) {
      return;
    }

    setState(() {
      _currentUser = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '小嘉审计助手',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: _restoringSession
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _currentUser == null
              ? LoginPage(
                  apiService: _apiService,
                  onLogin: _handleLogin,
                )
              : DashboardPage(
                  apiService: _apiService,
                  currentUser: _currentUser!,
                  onLogout: _handleLogout,
                ),
    );
  }
}
