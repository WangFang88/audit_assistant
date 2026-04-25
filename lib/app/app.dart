import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../features/auth/login_page.dart';
import '../features/dashboard/dashboard_page.dart';

class AuditAssistantApp extends StatefulWidget {
  const AuditAssistantApp({super.key});

  @override
  State<AuditAssistantApp> createState() => _AuditAssistantAppState();
}

class _AuditAssistantAppState extends State<AuditAssistantApp> {
  bool _loggedIn = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '小嘉审计助手',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: _loggedIn
          ? const DashboardPage()
          : LoginPage(onLogin: () => setState(() => _loggedIn = true)),
    );
  }
}
