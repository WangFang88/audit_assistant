import 'package:flutter_test/flutter_test.dart';

import 'package:audit_assistant/app/app.dart';

void main() {
  testWidgets('renders app shell', (WidgetTester tester) async {
    await tester.pumpWidget(const AuditAssistantApp());
    expect(find.byType(AuditAssistantApp), findsOneWidget);
  });
}
