import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  // ==================== 完整配色方案 ====================
  const primaryColor = Color(0xFF2D6AFF);        // 品牌蓝
  const primaryLight = Color(0xFF5B8DFF);        // 浅蓝（悬浮/高亮）
  const primaryBg = Color(0xFFF0F4FF);           // 极浅蓝背景（选中态/标签背景）

  // 辅助色（解决单调问题）
  const successColor = Color(0xFF10B981);        // 翠绿
  const warningColor = Color(0xFFF59E0B);        // 琥珀
  const errorColor = Color(0xFFEF4444);          // 红色
  const infoColor = Color(0xFF8B5CF6);           // 紫色

  // 背景分层
  const bgPage = Color(0xFFF5F7FA);              // 页面最底层
  const bgCard = Color(0xFFFFFFFF);              // 卡片背景
  const bgSidebar = Color(0xFFFFFFFF);           // 侧边栏背景
  const bgInput = Color(0xFFF9FAFB);             // 输入框背景

  // 文字颜色
  const textPrimary = Color(0xFF1A2C3E);         // 主要文字
  const textSecondary = Color(0xFF5B6E8C);       // 次要文字
  const textTertiary = Color(0xFF8E9DAD);        // 辅助文字

  const dividerColor = Color(0xFFE8ECF2);         // 分割线

  final colorScheme = ColorScheme.light(
    primary: primaryColor,
    secondary: textSecondary,
    tertiary: infoColor,
    error: errorColor,
    surface: bgCard,
    background: bgPage,
    onPrimary: Colors.white,
    onSecondary: Colors.white,
    onSurface: textPrimary,
    onBackground: textPrimary,
    outline: dividerColor,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,

    // ==================== 页面背景 ====================
    scaffoldBackgroundColor: bgPage,

    // ==================== AppBar ====================
    appBarTheme: const AppBarTheme(
      centerTitle: false,
      backgroundColor: bgCard,
      foregroundColor: textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
    ),

    // ==================== 卡片样式 ====================
    cardTheme: CardThemeData(
      elevation: 1,
      shadowColor: Colors.black.withOpacity(0.04),
      color: bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      surfaceTintColor: Colors.transparent,
    ),

    // ==================== 输入框样式 ====================
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: bgInput,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryColor, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: const TextStyle(
        color: textTertiary,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),

    // ==================== 按钮样式 ====================
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      ),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        disabledBackgroundColor: const Color(0xFFD0D5DD),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: textSecondary,
        side: const BorderSide(color: dividerColor, width: 1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        textStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),

    // ==================== Chip 标签（用于状态/类型） ====================
    chipTheme: ChipThemeData(
      backgroundColor: primaryBg,
      labelStyle: const TextStyle(color: primaryColor, fontSize: 12),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
    ),

    // ==================== 列表项（项目组列表） ====================
    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor: Colors.transparent,
      selectedTileColor: primaryBg,

      selectedColor: primaryColor,
      textColor: textPrimary,
      titleTextStyle: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: textPrimary,
      ),
      subtitleTextStyle: const TextStyle(
        fontSize: 12,
        color: textTertiary,
      ),
    ),

    // ==================== 分割线 ====================
    dividerTheme: const DividerThemeData(
      color: dividerColor,
      thickness: 1,
      space: 0,
    ),

    // ==================== 文字主题 ====================
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, color: textPrimary),
      displayMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: textPrimary),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: textPrimary),
      bodyLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: textPrimary),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: textPrimary),
      bodySmall: TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: textSecondary),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: textTertiary),
    ),

    // ==================== 对话框 ====================
    dialogTheme: DialogThemeData(
      backgroundColor: bgCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      titleTextStyle: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      ),
      contentTextStyle: const TextStyle(
        fontSize: 14,
        color: textSecondary,
      ),
    ),

    // ==================== 底部弹窗 ====================
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: bgCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      elevation: 0,
    ),

    // ==================== 图标 ====================
    iconTheme: const IconThemeData(
      color: textTertiary,
      size: 20,
    ),

    // ==================== 底部导航栏（手机端） ====================
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: bgCard,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      indicatorColor: primaryBg,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: primaryColor,
          );
        }
        return const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: textTertiary,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: primaryColor, size: 24);
        }
        return const IconThemeData(color: textTertiary, size: 24);
      }),
    ),

    // ==================== SnackBar ====================
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: textPrimary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14),
    ),

    // ==================== NavigationRail ====================
    navigationRailTheme: NavigationRailThemeData(
      backgroundColor: bgSidebar,
      selectedIconTheme: const IconThemeData(color: primaryColor, size: 24),
      unselectedIconTheme: IconThemeData(color: textTertiary, size: 24),
      selectedLabelTextStyle: const TextStyle(color: primaryColor, fontSize: 12, fontWeight: FontWeight.w500),
      unselectedLabelTextStyle: TextStyle(color: textTertiary, fontSize: 12),
      indicatorColor: primaryBg,
    ),
  );
}