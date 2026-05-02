import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';

class MobileDocsPage extends StatefulWidget {
  const MobileDocsPage({super.key, required this.apiService});
  final ApiService apiService;

  @override
  State<MobileDocsPage> createState() => _MobileDocsPageState();
}

class _MobileDocsPageState extends State<MobileDocsPage> {
  bool _loading = true;
  List<KnowledgeDocument> _docs = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final docs = await widget.apiService.fetchDocuments();
      if (!mounted) return;
      setState(() { _docs = docs; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        const SizedBox(height: 12),
        FilledButton(onPressed: _load, child: const Text('重试')),
      ]));
    }
    if (_docs.isEmpty) {
      return const Center(child: Text('暂无文档'));
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: _docs.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, i) => _DocTile(doc: _docs[i]),
      ),
    );
  }
}

class _DocTile extends StatelessWidget {
  const _DocTile({required this.doc});
  final KnowledgeDocument doc;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPrivate = doc.libraryType == 'private';
    return Card(
      child: ListTile(
        leading: Icon(
          doc.fileType == 'pdf' ? Icons.picture_as_pdf_outlined : Icons.description_outlined,
          color: doc.fileType == 'pdf' ? const Color(0xFFDC2626) : theme.colorScheme.primary,
        ),
        title: Text(doc.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14)),
        subtitle: Text(
          '${isPrivate ? "私有库" : "公共库"} · ${doc.indexStatus}',
          style: theme.textTheme.bodySmall,
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isPrivate ? theme.colorScheme.secondaryContainer : theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            isPrivate ? '私有' : '公共',
            style: TextStyle(fontSize: 11, color: isPrivate ? theme.colorScheme.onSecondaryContainer : theme.colorScheme.onPrimaryContainer),
          ),
        ),
      ),
    );
  }
}
