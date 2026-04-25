class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    required this.trialEndsAt,
  });

  final String id;
  final String name;
  final String phone;
  final String role;
  final String trialEndsAt;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? '',
      trialEndsAt: json['trialEndsAt'] as String? ?? '',
    );
  }
}

class ProjectGroup {
  const ProjectGroup({
    required this.id,
    required this.name,
    required this.organizationName,
    required this.memberCount,
    required this.privateDocumentCount,
    required this.lastQueryAt,
  });

  final String id;
  final String name;
  final String organizationName;
  final int memberCount;
  final int privateDocumentCount;
  final String lastQueryAt;

  factory ProjectGroup.fromJson(Map<String, dynamic> json) {
    return ProjectGroup(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      organizationName: json['organizationName'] as String? ?? '',
      memberCount: json['memberCount'] as int? ?? 0,
      privateDocumentCount: json['privateDocumentCount'] as int? ?? 0,
      lastQueryAt: (json['lastQueryAt'] as String?) ?? '--',
    );
  }
}

class GroupMember {
  const GroupMember({
    required this.id,
    required this.groupId,
    required this.userId,
    required this.name,
    required this.phone,
    required this.role,
  });

  final String id;
  final String groupId;
  final String userId;
  final String name;
  final String phone;
  final String role;

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: json['id'] as String? ?? '',
      groupId: json['groupId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: _mapMemberRole(json['role'] as String? ?? ''),
    );
  }
}

class KnowledgeDocument {
  const KnowledgeDocument({
    required this.id,
    required this.title,
    required this.libraryType,
    required this.extractionMode,
    required this.indexStatus,
    required this.chunkCount,
    required this.fileType,
    required this.chunkStrategy,
  });

  final String id;
  final String title;
  final String libraryType;
  final String extractionMode;
  final String indexStatus;
  final int chunkCount;
  final String fileType;
  final String chunkStrategy;

  factory KnowledgeDocument.fromJson(Map<String, dynamic> json) {
    return KnowledgeDocument(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      libraryType: _mapLibraryType(json['libraryType'] as String? ?? ''),
      extractionMode: _mapExtractionMode(json['extractionMode'] as String? ?? ''),
      indexStatus: _mapIndexStatus(json['indexStatus'] as String? ?? ''),
      chunkCount: json['chunkCount'] as int? ?? 0,
      fileType: (json['fileType'] as String? ?? '').toUpperCase(),
      chunkStrategy: _mapChunkStrategy(json['chunkStrategy'] as String? ?? ''),
    );
  }
}

class QueryCitation {
  const QueryCitation({
    required this.title,
    required this.libraryType,
    required this.score,
    required this.matchedChunk,
    required this.reason,
    required this.articleRef,
    required this.chapterTitle,
    required this.pageLabel,
  });

  final String title;
  final String libraryType;
  final double score;
  final String matchedChunk;
  final String reason;
  final String articleRef;
  final String chapterTitle;
  final String pageLabel;

  factory QueryCitation.fromJson(Map<String, dynamic> json) {
    return QueryCitation(
      title: json['title'] as String? ?? '',
      libraryType: _mapLibraryType(json['libraryType'] as String? ?? ''),
      score: (json['score'] as num?)?.toDouble() ?? 0,
      matchedChunk: json['matchedChunk'] as String? ?? '',
      reason: json['reason'] as String? ?? '',
      articleRef: json['articleRef'] as String? ?? '',
      chapterTitle: json['chapterTitle'] as String? ?? '',
      pageLabel: json['pageLabel'] as String? ?? '',
    );
  }
}

class QueryResult {
  const QueryResult({
    required this.answer,
    required this.explanation,
    required this.pipeline,
    required this.retrievalStats,
    required this.citations,
  });

  final String answer;
  final String explanation;
  final List<String> pipeline;
  final QueryRetrievalStats retrievalStats;
  final List<QueryCitation> citations;

  factory QueryResult.fromJson(Map<String, dynamic> json) {
    return QueryResult(
      answer: json['answer'] as String? ?? '',
      explanation: json['explanation'] as String? ?? '',
      pipeline: (json['pipeline'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      retrievalStats: QueryRetrievalStats.fromJson(
        json['retrievalStats'] as Map<String, dynamic>? ?? const {},
      ),
      citations: (json['citations'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(QueryCitation.fromJson)
          .toList(),
    );
  }
}

class QueryRetrievalStats {
  const QueryRetrievalStats({
    required this.queryMode,
    required this.candidateChunks,
    required this.returnedCitations,
  });

  final String queryMode;
  final int candidateChunks;
  final int returnedCitations;

  factory QueryRetrievalStats.fromJson(Map<String, dynamic> json) {
    return QueryRetrievalStats(
      queryMode: json['queryMode'] as String? ?? '',
      candidateChunks: json['candidateChunks'] as int? ?? 0,
      returnedCitations: json['returnedCitations'] as int? ?? 0,
    );
  }
}

class ConversationSummary {
  const ConversationSummary({
    required this.id,
    required this.title,
    required this.type,
    required this.lastMessage,
    required this.unreadCount,
  });

  final String id;
  final String title;
  final String type;
  final String lastMessage;
  final int unreadCount;

  factory ConversationSummary.fromJson(Map<String, dynamic> json) {
    final rawType = json['type'] as String? ?? '';
    return ConversationSummary(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      type: rawType == 'group' ? '群聊' : rawType == 'direct' ? '私信' : rawType,
      lastMessage: json['lastMessage'] as String? ?? '',
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderName,
    required this.content,
    required this.sentAt,
  });

  final String id;
  final String conversationId;
  final String senderName;
  final String content;
  final String sentAt;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      conversationId: json['conversationId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? '',
      content: json['content'] as String? ?? '',
      sentAt: json['sentAt'] as String? ?? '',
    );
  }
}

class ExtractionJob {
  const ExtractionJob({
    required this.id,
    required this.documentId,
    required this.status,
    required this.stage,
    required this.progress,
    required this.startedAt,
  });

  final String id;
  final String documentId;
  final String status;
  final String stage;
  final int progress;
  final String startedAt;

  factory ExtractionJob.fromJson(Map<String, dynamic> json) {
    return ExtractionJob(
      id: json['id'] as String? ?? '',
      documentId: json['documentId'] as String? ?? '',
      status: _mapJobStatus(json['status'] as String? ?? ''),
      stage: _mapJobStage(json['stage'] as String? ?? ''),
      progress: json['progress'] as int? ?? 0,
      startedAt: json['startedAt'] as String? ?? '',
    );
  }
}

class ImportDocumentResult {
  const ImportDocumentResult({
    required this.id,
    required this.title,
    required this.libraryType,
    required this.sourcePath,
    required this.groupId,
    required this.fileType,
    required this.extractionMode,
    required this.indexStatus,
    required this.chunkStrategy,
    required this.notes,
  });

  final String id;
  final String title;
  final String libraryType;
  final String sourcePath;
  final String? groupId;
  final String fileType;
  final String extractionMode;
  final String indexStatus;
  final String chunkStrategy;
  final String notes;

  factory ImportDocumentResult.fromJson(Map<String, dynamic> json) {
    return ImportDocumentResult(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      libraryType: _mapLibraryType(json['libraryType'] as String? ?? ''),
      sourcePath: json['sourcePath'] as String? ?? '',
      groupId: json['groupId'] as String?,
      fileType: (json['fileType'] as String? ?? '').toUpperCase(),
      extractionMode: _mapExtractionMode(json['extractionMode'] as String? ?? ''),
      indexStatus: _mapIndexStatus(json['indexStatus'] as String? ?? ''),
      chunkStrategy: _mapChunkStrategy(json['chunkStrategy'] as String? ?? ''),
      notes: json['notes'] as String? ?? '',
    );
  }
}

class SubscriptionOverview {
  const SubscriptionOverview({
    required this.planName,
    required this.priceLabel,
    required this.groupUsage,
    required this.documentUsage,
    required this.queryUsage,
  });

  final String planName;
  final String priceLabel;
  final String groupUsage;
  final String documentUsage;
  final String queryUsage;

  factory SubscriptionOverview.fromJson(Map<String, dynamic> json) {
    final usage = json['usage'] as Map<String, dynamic>? ?? const {};
    final groups = usage['groups'] as Map<String, dynamic>? ?? const {};
    final privateDocuments = usage['privateDocuments'] as Map<String, dynamic>? ?? const {};
    final dailyQueries = usage['dailyQueries'] as Map<String, dynamic>? ?? const {};
    final plans = json['plans'] as List<dynamic>? ?? const [];
    final currentPlanId = json['currentPlanId'] as String? ?? '';
    final currentPlan = plans.whereType<Map<String, dynamic>>().firstWhere(
          (plan) => plan['id'] == currentPlanId,
          orElse: () => const {},
        );

    return SubscriptionOverview(
      planName: currentPlan['name'] as String? ?? '未设置套餐',
      priceLabel: currentPlan['priceLabel'] as String? ?? '--',
      groupUsage: '项目组 ${groups['used'] ?? 0} / ${groups['limit'] ?? 0}',
      documentUsage:
          '私有文件 ${privateDocuments['used'] ?? 0} / ${privateDocuments['limit'] ?? 0}',
      queryUsage: '今日查询 ${dailyQueries['used'] ?? 0} / ${dailyQueries['limit'] ?? 0}',
    );
  }
}

class DashboardOverview {
  const DashboardOverview({
    required this.user,
    required this.groups,
    required this.documents,
    required this.extractJobs,
    required this.conversations,
    required this.subscription,
    required this.featuredQuery,
  });

  final AppUser user;
  final List<ProjectGroup> groups;
  final List<KnowledgeDocument> documents;
  final List<ExtractionJob> extractJobs;
  final List<ConversationSummary> conversations;
  final SubscriptionOverview subscription;
  final QueryResult featuredQuery;

  factory DashboardOverview.fromJson(Map<String, dynamic> json) {
    return DashboardOverview(
      user: AppUser.fromJson(json['user'] as Map<String, dynamic>? ?? const {}),
      groups: (json['groups'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ProjectGroup.fromJson)
          .toList(),
      documents: (json['documents'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(KnowledgeDocument.fromJson)
          .toList(),
      extractJobs: (json['extractJobs'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ExtractionJob.fromJson)
          .toList(),
      conversations: (json['conversations'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ConversationSummary.fromJson)
          .toList(),
      subscription:
          SubscriptionOverview.fromJson(json['subscription'] as Map<String, dynamic>? ?? const {}),
      featuredQuery:
          QueryResult.fromJson(json['featuredQuery'] as Map<String, dynamic>? ?? const {}),
    );
  }
}

String _mapLibraryType(String value) {
  switch (value) {
    case 'public':
      return '公共库';
    case 'private':
      return '私有库';
    default:
      return value;
  }
}

String _mapExtractionMode(String value) {
  switch (value) {
    case 'text':
      return '文字抽取';
    case 'ocr':
      return 'OCR';
    default:
      return value;
  }
}

String _mapIndexStatus(String value) {
  switch (value) {
    case 'ready':
      return '已建索引';
    case 'processing':
      return '处理中';
    case 'queued':
      return '排队中';
    default:
      return value;
  }
}

String _mapChunkStrategy(String value) {
  switch (value) {
    case 'structure-first':
      return '结构优先切分';
    case 'length-fallback':
      return '长度回退切分';
    default:
      return value;
  }
}

String _mapMemberRole(String value) {
  switch (value) {
    case 'leader':
      return '组长';
    case 'member':
      return '成员';
    default:
      return value;
  }
}

String _mapJobStatus(String value) {
  switch (value) {
    case 'processing':
      return '处理中';
    case 'queued':
      return '排队中';
    case 'completed':
      return '已完成';
    default:
      return value;
  }
}

String _mapJobStage(String value) {
  switch (value) {
    case 'extract':
      return '文字抽取';
    case 'ocr':
      return 'OCR';
    case 'chunk':
      return '文本切分';
    case 'index':
      return '建立索引';
    default:
      return value;
  }
}
