import 'package:flutter/material.dart';

ThemeData buildAppTheme() {
  // 自定义浅色清爽色系
  const primaryColor = Color(0xFF2D6AFF);      // 品牌蓝（更清爽）
  const secondaryColor = Color(0xFF5C6A81);    // 次要文字
  const surfaceColor = Color(0xFFFFFFFF);      // 卡片/面板背景
  const backgroundColor = Color(0xFFF5F7FA);   // 页面背景
  const dividerColor = Color(0xFFE8ECF2);       // 分割线

  final colorScheme = ColorScheme.light(
    primary: primaryColor,
    secondary: secondaryColor,
    surface: surfaceColor,
    background: backgroundColor,
    onPrimary: Colors.white,
    onSecondary: Colors.white,
    onSurface: const Color(0xFF1F2A3E),         // 主要文字
    onBackground: const Color(0xFF1F2A3E),
    outline: dividerColor,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    
    // 页面背景
    scaffoldBackgroundColor: backgroundColor,
    
    // AppBar 样式
    appBarTheme: AppBarTheme(
      centerTitle: false,
      backgroundColor: Colors.white,
      foregroundColor: const Color(0xFF1F2A3E),
      elevation: 0,
      scrolledUnderElevation: 0,
      titleTextStyle: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w500,
        color: Color(0xFF1F2A3E),
      ),
    ),
    
    // 卡片样式
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16), // 比原来略小，更精致
      ),
      margin: const EdgeInsets.all(0),
      clipBehavior: Clip.antiAlias,
      surfaceTintColor: Colors.transparent, // 去掉 Material3 的默认染色
    ),
    
    // 输入框样式
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF5F7FA),      // 浅灰背景，区别于白色卡片
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
        borderSide: const BorderSide(color: Color(0xFF2D6AFF), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: const TextStyle(
        color: Color(0xFF8E9AAD),
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),
    
    // 按钮样式（主按钮）
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
    
    // 次要按钮（文字+边框）
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF5C6A81),
        side: const BorderSide(color: Color(0xFFE8ECF2), width: 1),
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
    
    // 文字按钮（用于“新建项目组”等）
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
    
    // 分割线颜色
    dividerTheme: const DividerThemeData(
      color: Color(0xFFE8ECF2),
      thickness: 1,
      space: 0,
    ),
    
    // 全局文字主题
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w600, color: Color(0xFF1F2A3E)),
      displayMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Color(0xFF1F2A3E)),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1F2A3E)),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1F2A3E)),
      bodyLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w400, color: Color(0xFF1F2A3E)),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Color(0xFF1F2A3E)),
      bodySmall: TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: Color(0xFF5C6A81)),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF8E9AAD)),
    ),
    
    // 列表项样式（项目组列表）
    listTileTheme: ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor: Colors.transparent,
      selectedTileColor: const Color(0xFFF0F4FF),  // 选中态浅蓝背景
      selectedColor: primaryColor,
      textColor: const Color(0xFF1F2A3E),
    ),
    
    // 对话框样式
    dialogTheme: DialogThemeData(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 0,
      titleTextStyle: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Color(0xFF1F2A3E),
      ),
      contentTextStyle: const TextStyle(
        fontSize: 14,
        color: Color(0xFF5C6A81),
      ),
    ),
    
    // 底部弹窗
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      elevation: 0,
    ),
    
    // 图标主题（用于线性图标）
    iconTheme: const IconThemeData(
      color: Color(0xFF8E9AAD),
      size: 20,
    ),
    
    // 导航栏（底部Tab）
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      indicatorColor: const Color(0xFFF0F4FF),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF2D6AFF));
        }
        return const TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF8E9AAD));
      }),
    ),
  );
}