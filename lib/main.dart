import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const AuditAssistantApp());
}

class AuditAssistantApp extends StatelessWidget {
  const AuditAssistantApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '审计助手',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
