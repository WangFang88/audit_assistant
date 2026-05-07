import 'package:flutter/material.dart';

import '../../core/services/api_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.apiService, required this.onLogin});

  final ApiService apiService;
  final ValueChanged<LoginResponse> onLogin;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  bool _isValidPhone(String value) {
    final phone = value.trim();
    return phone.length == 11 && int.tryParse(phone) != null;
  }

  Future<void> _submit({required bool register}) async {
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();
    FocusScope.of(context).unfocus();

    if (register) {
      if (!_isValidPhone(phone)) {
        setState(() {
          _error = '请输入 11 位手机号后再注册。';
        });
        return;
      }
      if (password.length < 6) {
        setState(() {
          _error = '注册密码至少需要 6 位。';
        });
        return;
      }
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final result = register
          ? await widget.apiService.register(phone: phone, password: password)
          : await widget.apiService.login(phone: phone, password: password);
      if (!mounted) {
        return;
      }
      widget.onLogin(result);
    } on ApiException catch (error) {
      setState(() {
        _error = error.message;
      });
    } catch (_) {
      setState(() {
        _error = register ? '注册失败，请检查后端服务是否已启动。' : '登录失败，请检查后端服务是否已启动。';
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.primary.withValues(alpha: 0.05),
              theme.colorScheme.surface,
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                elevation: 2,
                shadowColor: Colors.black.withValues(alpha: 0.08),
                child: Padding(
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(Icons.analytics_outlined, size: 48, color: theme.colorScheme.primary),
                      const SizedBox(height: 20),
                      Text(
                        '小嘉审计助手',
                        style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '浏览器访问、项目组协作、公共库与私有库统一检索',
                        style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      TextField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: '账号 / 手机号',
                          prefixIcon: Icon(Icons.phone_android),
                        ),
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        onSubmitted: (_) => _submitting ? null : _submit(register: false),
                        decoration: const InputDecoration(
                          labelText: '密码',
                          prefixIcon: Icon(Icons.lock_outline),
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, size: 18, color: theme.colorScheme.error),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_error!, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 28),
                      FilledButton(
                        onPressed: _submitting ? null : () => _submit(register: false),
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _submitting
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Text('登录并进入工作台', style: TextStyle(fontSize: 15)),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: _submitting ? null : () => _submit(register: true),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('注册并登录', style: TextStyle(fontSize: 15)),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        '请先启动 backend 服务后登录',
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
