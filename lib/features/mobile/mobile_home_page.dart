import 'dart:async';
import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';

Map<String, String> _parseCaseChunk(String chunk) {
  final lines = chunk.split('\n').where((l) => l.trim().isNotEmpty).toList();
  if (lines.isEmpty) return {};

  final lastLine = lines.last;
  final fields = lastLine.split(',');

  String getField(int index) => index < fields.length ? fields[index].trim() : '';

  return {
    'category': getField(fields.length - 5),
    'subcategory': getField(fields.length - 4),
    'problemType': getField(fields.length - 3),
    'description': getField(fields.length - 2),
    'basis': getField(fields.length - 1),
  };
}

class MobileHomePage extends StatefulWidget {
  const MobileHomePage({super.key, required this.apiService, required this.user});
  final ApiService apiService;
  final AppUser user;

  @override
  State<MobileHomePage> createState() => _MobileHomePageState();
}

class _MobileHomePageState extends State<MobileHomePage> {
  final _questionController = TextEditingController();
  bool _loading = true;
  bool _searching = false;
  String? _error;
  DashboardOverview? _overview;
  QueryResult? _result;
  List<Map<String, dynamic>> _queryHistory = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _questionController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final overview = await widget.apiService.fetchDashboard();
      final queryHistory = await widget.apiService.getQueryHistory(teamId: null);
      if (!mounted) return;
      setState(() {
        _overview = overview;
        _queryHistory = queryHistory;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  String? _queryScope;

  Future<void> _search() async {
    final q = _questionController.text.trim();
    if (q.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() { _searching = true; _result = null; });
    try {
      final result = await widget.apiService.search(question: q, queryScope: _queryScope);
      final queryHistory = await widget.apiService.getQueryHistory(teamId: null);
      if (!mounted) return;
      setState(() {
        _result = result;
        _queryHistory = queryHistory;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('检索失败：$e')));
    } finally {
      if (mounted) setState(() { _searching = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
        const SizedBox(height: 12),
        FilledButton(onPressed: _load, child: const Text('重试')),
      ]));
    }
    final overview = _overview!;
    final sub = overview.subscription;
    return RefreshIndicator(
      onRefresh: _load,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          // Hero
          _HeroCard(user: widget.user, subscription: sub),
          const SizedBox(height: 16),
          // Feature cards 2x2
          _FeatureGrid(onTap: (scope, hint) {
            setState(() { _queryScope = scope; _questionController.text = hint; });
          }),
          const SizedBox(height: 16),
          // Search box
          TextField(
            controller: _questionController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: '请输入审计问题，例如：学校食堂采购有哪些风险？',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
            ),
          ),
          const SizedBox(height: 10),
          FilledButton.icon(
            onPressed: _searching ? null : _search,
            icon: _searching
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.search),
            label: Text(_searching ? '检索中…' : '开始审计问答'),
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
          ),
          const SizedBox(height: 20),
          // Query History
          if (_queryHistory.isNotEmpty) ...[
            Text('检索历史', style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              decoration: BoxDecoration(
                border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.2)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _queryHistory.length,
                separatorBuilder: (_, __) => Divider(height: 1, color: theme.colorScheme.outline.withValues(alpha: 0.1)),
                itemBuilder: (context, index) {
                  final h = _queryHistory[index];
                  final timestamp = DateTime.parse(h['queriedAt'] as String);
                  final timeStr = '${timestamp.month}/${timestamp.day} ${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
                  return ListTile(
                    dense: true,
                    leading: Icon(Icons.search, size: 18, color: theme.colorScheme.outline),
                    title: Text(
                      h['queryText'] as String,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall,
                    ),
                    subtitle: Text(timeStr, style: theme.textTheme.labelSmall),
                    onTap: () {
                      _questionController.text = h['queryText'] as String;
                      if (h['queryResult'] != null) {
                        try {
                          final result = QueryResult.fromJson(h['queryResult'] as Map<String, dynamic>);
                          setState(() {
                            _result = result;
                          });
                        } catch (e) {
                          _search();
                        }
                      } else {
                        _search();
                      }
                    },
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
          // Result
          if (_result != null) _ResultCard(result: _result!, apiService: widget.apiService),
          // Quota
          _QuotaCard(subscription: sub),
        ]),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.user, required this.subscription});
  final AppUser user;
  final SubscriptionOverview subscription;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = subscription;
    final statusText = s.effectiveOrder != null
        ? '${s.effectiveOrder!.planLabel} · 到期：${s.effectiveOrder!.expiredAt}'
        : '试用到期：${s.trialEndsAt}';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [theme.colorScheme.primary, theme.colorScheme.primary.withValues(alpha: 0.75)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('小嘉审计助手', style: theme.textTheme.titleMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text('AI 审计工作台', style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.75))),
          const SizedBox(height: 6),
          Text('你好，${user.name} · $statusText', style: theme.textTheme.bodySmall?.copyWith(color: Colors.white.withValues(alpha: 0.9))),
        ])),
        Icon(Icons.balance_outlined, color: Colors.white.withValues(alpha: 0.5), size: 32),
      ]),
    );
  }
}

class _FeatureGrid extends StatelessWidget {
  const _FeatureGrid({required this.onTap});
  final void Function(String scope, String hint) onTap;

  static const _cards = [
    (Icons.gavel_outlined, Color(0xFF1D4ED8), '法条查询', '国家法律与政策文件', 'regulation', '请检索与法条查询相关的制度依据。'),
    (Icons.library_books_outlined, Color(0xFF0891B2), '资料库问答', '自建/购买资料智能问答', 'material', '请检索项目组资料库中的相关内容。'),
    (Icons.cases_outlined, Color(0xFF7C3AED), '案例参考', '全国/地方审计案例', 'case', '请检索与此问题相关的审计案例。'),
    (Icons.checklist_outlined, Color(0xFF059669), '风险排查', '结合法条案例生成检查点', 'risk', '请结合法条和案例生成风险检查点。'),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.7,
      children: _cards.map((c) {
        final (icon, color, title, subtitle, scope, hint) = c;
        return InkWell(
          onTap: () => onTap(scope, hint),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.06),
              border: Border.all(color: color.withValues(alpha: 0.2)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 4),
              Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: color)),
              Text(subtitle, style: TextStyle(fontSize: 10, color: color.withValues(alpha: 0.7)), maxLines: 1, overflow: TextOverflow.ellipsis),
            ]),
          ),
        );
      }).toList(),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result, required this.apiService});
  final QueryResult result;
  final ApiService apiService;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('检索结果', style: theme.textTheme.titleSmall),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(10),
            ),
            child: SelectableText(result.answer, style: theme.textTheme.bodyMedium),
          ),
          if (result.citations.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('参考来源 (${result.citations.length})', style: theme.textTheme.labelMedium),
            const SizedBox(height: 8),
            ...result.citations.take(3).map((c) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(c.title, style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(c.matchedChunk, style: theme.textTheme.bodySmall, maxLines: 3, overflow: TextOverflow.ellipsis),
                ]),
              ),
            )),
          ],
          if (result.similarCases.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('相关审计案例 (${result.similarCases.length})', style: theme.textTheme.labelMedium),
            const SizedBox(height: 8),
            ...result.similarCases.take(2).map((c) {
              final parsed = _parseCaseChunk(c.matchedChunk);
              final description = parsed['description'] ?? '';
              final basis = parsed['basis'] ?? '';
              final problemType = parsed['problemType'] ?? '';

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(8),
                  onTap: c.documentId.isEmpty
                      ? null
                      : () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => _CaseDetailPage(apiService: apiService, citation: c),
                            ),
                          ),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.secondaryContainer.withValues(alpha: 0.35),
                      border: Border.all(color: theme.colorScheme.outlineVariant),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(
                        children: [
                          Expanded(child: Text(c.title, style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600))),
                          const SizedBox(width: 8),
                          Icon(Icons.chevron_right, size: 18, color: theme.colorScheme.outline),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        [
                          if (problemType.isNotEmpty) '问题类型：$problemType',
                          if (description.isNotEmpty) '问题描述：$description',
                          if (basis.isNotEmpty) '定性依据：$basis',
                        ].join('\n'),
                        style: theme.textTheme.bodySmall,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ]),
                  ),
                ),
              );
            }),
          ],
        ]),
      ),
    );
  }
}

class _CaseDetailPage extends StatefulWidget {
  const _CaseDetailPage({required this.apiService, required this.citation});
  final ApiService apiService;
  final QueryCitation citation;

  @override
  State<_CaseDetailPage> createState() => _CaseDetailPageState();
}

class _CaseDetailPageState extends State<_CaseDetailPage> {
  bool _loading = true;
  List<DocumentChunkPreview> _chunks = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final chunks = await widget.apiService.fetchDocumentChunks(widget.citation.documentId);
      if (!mounted) return;
      setState(() {
        _chunks = chunks;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(widget.citation.title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text('加载失败：$_error', style: TextStyle(color: theme.colorScheme.error)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.secondaryContainer.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(widget.citation.matchedChunk, style: theme.textTheme.bodyMedium),
                    ),
                    const SizedBox(height: 12),
                    Text('完整案例内容', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 8),
                    ..._chunks.map((chunk) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${chunk.chapterTitle}${chunk.articleRef.isNotEmpty ? ' · ${chunk.articleRef}' : ''}',
                              style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            SelectableText(chunk.content, style: theme.textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    )),
                  ],
                ),
    );
  }
}

class _QuotaCard extends StatelessWidget {
  const _QuotaCard({required this.subscription});
  final SubscriptionOverview subscription;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = subscription;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('使用额度', style: theme.textTheme.titleSmall),
          const SizedBox(height: 12),
          _QuotaRow(label: '今日查询', used: s.dailyQueriesUsed, limit: s.dailyQueriesLimit),
          const SizedBox(height: 8),
          _QuotaRow(label: '私有文件', used: s.privateDocumentsUsed, limit: s.privateDocumentsLimit),
          const SizedBox(height: 8),
          _QuotaRow(label: '项目组', used: s.groupsUsed, limit: s.groupsLimit),
        ]),
      ),
    );
  }
}

class _QuotaRow extends StatelessWidget {
  const _QuotaRow({required this.label, required this.used, required this.limit});
  final String label;
  final int used;
  final int limit;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ratio = limit > 0 ? (used / limit).clamp(0.0, 1.0) : 0.0;
    final nearLimit = ratio >= 0.8;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: theme.textTheme.bodySmall),
        Text(limit > 0 ? '$used / $limit' : '不限',
            style: theme.textTheme.bodySmall?.copyWith(color: nearLimit ? theme.colorScheme.error : null)),
      ]),
      const SizedBox(height: 4),
      if (limit > 0)
        LinearProgressIndicator(
          value: ratio,
          color: nearLimit ? theme.colorScheme.error : theme.colorScheme.primary,
          backgroundColor: theme.colorScheme.surfaceContainerHighest,
          minHeight: 4,
          borderRadius: BorderRadius.circular(2),
        ),
    ]);
  }
}
