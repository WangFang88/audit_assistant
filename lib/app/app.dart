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

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '小嘉审计助手',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: _currentUser == null
          ? LoginPage(
              apiService: _apiService,
              onLogin: (user) => setState(() => _currentUser = user),
            )
          : DashboardPage(
              apiService: _apiService,
              currentUser: _currentUser!,
              onLogout: () => setState(() => _currentUser = null),
            ),
    );
  }
}
