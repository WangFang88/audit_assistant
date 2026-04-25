import 'package:flutter/material.dart';

import '../core/models/app_models.dart';
import '../core/services/api_service.dart';
import '../features/dashboard/dashboard_page.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.apiService,
    required this.currentUser,
    required this.onLogout,
  });

  final ApiService apiService;
  final AppUser currentUser;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return DashboardPage(
      apiService: apiService,
      currentUser: currentUser,
      onLogout: onLogout,
    );
  }
}
