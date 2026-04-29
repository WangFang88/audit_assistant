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
  final _phoneController = TextEditingController(text: '13800138001');
  final _passwordController = TextEditingController(text: '123456');
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
    return Scaffold(
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('小嘉审计助手', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      '浏览器访问、项目组协作、公共库与私有库统一检索。',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _phoneController,
                      decoration: const InputDecoration(labelText: '账号 / 手机号'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      onSubmitted: (_) => _submitting ? null : _submit(register: false),
                      decoration: const InputDecoration(labelText: '密码'),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: TextStyle(color: Theme.of(context).colorScheme.error),
                      ),
                    ],
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: _submitting ? null : () => _submit(register: false),
                      child: _submitting
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('登录并进入工作台'),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _submitting ? null : () => _submit(register: true),
                      child: const Text('注册并登录'),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '请先启动 backend 服务后登录。',
                      style: Theme.of(context).textTheme.bodySmall,
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
