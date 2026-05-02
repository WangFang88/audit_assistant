import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../core/models/app_models.dart';
import '../../core/services/api_service.dart';

class MobileDocsPage extends StatefulWidget {
  const MobileDocsPage({super.key, required this.apiService, this.groupId});
  final ApiService apiService;
  final String? groupId;

  @override
  State<MobileDocsPage> createState() => _MobileDocsPageState();
}

class _MobileDocsPageState extends State<MobileDocsPage> {
  bool _loading = true;
  bool _uploading = false;
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
      final docs = await widget.apiService.fetchDocuments(groupId: widget.groupId);
      if (!mounted) return;
      setState(() { _docs = docs; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  Future<void> _showUploadDialog() async {
    final titleController = TextEditingController();
    String libraryType = widget.groupId != null ? '私有库' : '公共库';
    PlatformFile? selectedFile;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('上传文档'),
          content: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: '文档标题', isDense: true),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: libraryType,
              decoration: const InputDecoration(labelText: '库类型', isDense: true),
              items: const [
                DropdownMenuItem(value: '公共库', child: Text('公共库')),
                DropdownMenuItem(value: '私有库', child: Text('私有库')),
              ],
              onChanged: (v) => setDialogState(() => libraryType = v!),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                final result = await FilePicker.platform.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
                  withData: true,
                );
                if (result != null) setDialogState(() => selectedFile = result.files.first);
              },
              icon: const Icon(Icons.attach_file, size: 16),
              label: Text(selectedFile == null ? '选择文件' : selectedFile!.name, overflow: TextOverflow.ellipsis),
            ),
          ]),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('取消')),
            FilledButton(
              onPressed: selectedFile == null ? null : () => Navigator.pop(ctx, true),
              child: const Text('上传'),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true || selectedFile == null) return;
    final title = titleController.text.trim().isEmpty ? selectedFile!.name : titleController.text.trim();

    setState(() => _uploading = true);
    try {
      final result = await widget.apiService.importDocument(
        title: title,
        libraryType: libraryType,
        file: selectedFile!,
        groupId: libraryType == '私有库' ? widget.groupId : null,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result.notes)));
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('上传失败：$e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
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
    return Scaffold(
      body: _docs.isEmpty
          ? const Center(child: Text('暂无文档，点击右下角上传'))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: _docs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) => _DocTile(doc: _docs[i]),
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _uploading ? null : _showUploadDialog,
        child: _uploading
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.upload_file),
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
