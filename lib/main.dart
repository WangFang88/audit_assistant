import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'app/app.dart';
import 'core/theme/app_theme.dart';
import 'features/mobile/mobile_app.dart';

void main() {
  runApp(const _RootApp());
}

class _RootApp extends StatelessWidget {
  const _RootApp();

  @override
  Widget build(BuildContext context) {
    const forceMobile = bool.fromEnvironment('FORCE_MOBILE');
    final isMobile = forceMobile ||
        (!kIsWeb && (defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.android));
    if (isMobile) {
      return MaterialApp(
        title: '小嘉审计助手',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: const MobileAuditApp(),
      );
    }
    return const AuditAssistantApp();
  }
}
