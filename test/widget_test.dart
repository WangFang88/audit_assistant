import 'package:flutter_test/flutter_test.dart';

import 'package:audit_assistant/app/app.dart';

void main() {
  testWidgets('renders app shell', (WidgetTester tester) async {
    await tester.runAsync(() async {
      await tester.pumpWidget(const AuditAssistantApp());
      expect(find.byType(AuditAssistantApp), findsOneWidget);

      // 等待一小段时间让初始化完成
      await tester.pump(const Duration(milliseconds: 100));
    });
  });
}
