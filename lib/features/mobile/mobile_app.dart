import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';
import '../auth/login_page.dart';
import 'mobile_account_page.dart';
import 'mobile_chat_page.dart';
import 'mobile_docs_page.dart';
import 'mobile_home_page.dart';

class MobileAuditApp extends StatefulWidget {
  const MobileAuditApp({super.key});

  @override
  State<MobileAuditApp> createState() => _MobileAuditAppState();
}

class _MobileAuditAppState extends State<MobileAuditApp> {
  final ApiService _apiService = ApiService();
  AppUser? _currentUser;
  bool _restoringSession = true;

  @override
  void initState() {
    super.initState();
    _apiService.onUnauthorized = () {
      if (mounted) setState(() { _currentUser = null; _restoringSession = false; });
    };
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    AppUser? user;
    try {
      user = await _apiService.restoreSession().timeout(const Duration(seconds: 8));
    } catch (_) {}
    if (!mounted) return;
    setState(() { _currentUser = user; _restoringSession = false; });
  }

  Future<void> _handleLogin(LoginResponse r) async {
    await _apiService.persistLogin(r);
    if (!mounted) return;
    setState(() => _currentUser = r.user);
  }

  Future<void> _handleLogout() async {
    await _apiService.clearSession();
    if (!mounted) return;
    setState(() => _currentUser = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_restoringSession) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_currentUser == null) {
      return LoginPage(apiService: _apiService, onLogin: _handleLogin);
    }
    return MobileShell(
      apiService: _apiService,
      user: _currentUser!,
      onLogout: _handleLogout,
    );
  }
}

class MobileShell extends StatefulWidget {
  const MobileShell({super.key, required this.apiService, required this.user, required this.onLogout});
  final ApiService apiService;
  final AppUser user;
  final VoidCallback onLogout;

  @override
  State<MobileShell> createState() => _MobileShellState();
}

class _MobileShellState extends State<MobileShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      MobileHomePage(apiService: widget.apiService, user: widget.user),
      MobileChatPage(apiService: widget.apiService, user: widget.user),
      MobileDocsPage(apiService: widget.apiService),
      MobileAccountPage(apiService: widget.apiService, user: widget.user, onLogout: widget.onLogout),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('小嘉审计助手'),
        centerTitle: true,
        elevation: 0,
      ),
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: '工作台'),
          NavigationDestination(icon: Icon(Icons.chat_outlined), selectedIcon: Icon(Icons.chat), label: '协作'),
          NavigationDestination(icon: Icon(Icons.folder_outlined), selectedIcon: Icon(Icons.folder), label: '资料库'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: '我的'),
        ],
      ),
    );
  }
}
