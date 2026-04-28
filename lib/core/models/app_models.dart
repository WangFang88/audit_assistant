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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'role': role,
      'trialEndsAt': trialEndsAt,
    };
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
    required this.parserTarget,
    required this.embeddingTarget,
    required this.vectorStoreTarget,
    required this.pipelineStage,
    required this.sourcePath,
    required this.uploadedAt,
  });

  final String id;
  final String title;
  final String libraryType;
  final String extractionMode;
  final String indexStatus;
  final int chunkCount;
  final String fileType;
  final String chunkStrategy;
  final String parserTarget;
  final String embeddingTarget;
  final String vectorStoreTarget;
  final String pipelineStage;
  final String sourcePath;
  final String uploadedAt;

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
      parserTarget: json['parserTarget'] as String? ?? '',
      embeddingTarget: json['embeddingTarget'] as String? ?? '',
      vectorStoreTarget: json['vectorStoreTarget'] as String? ?? '',
      pipelineStage: _mapPipelineStage(json['pipelineStage'] as String? ?? ''),
      sourcePath: json['sourcePath'] as String? ?? '',
      uploadedAt: json['uploadedAt'] as String? ?? '',
    );
  }
}

class DocumentChunkPreview {
  const DocumentChunkPreview({
    required this.id,
    required this.documentId,
    required this.libraryType,
    required this.title,
    required this.chapterTitle,
    required this.articleRef,
    required this.pageLabel,
    required this.content,
    required this.keywords,
    required this.indexStatus,
  });

  final String id;
  final String documentId;
  final String libraryType;
  final String title;
  final String chapterTitle;
  final String articleRef;
  final String pageLabel;
  final String content;
  final List<String> keywords;
  final String indexStatus;

  factory DocumentChunkPreview.fromJson(Map<String, dynamic> json) {
    return DocumentChunkPreview(
      id: json['id'] as String? ?? '',
      documentId: json['documentId'] as String? ?? '',
      libraryType: _mapLibraryType(json['libraryType'] as String? ?? ''),
      title: json['title'] as String? ?? '',
      chapterTitle: json['chapterTitle'] as String? ?? '',
      articleRef: json['articleRef'] as String? ?? '',
      pageLabel: json['pageLabel'] as String? ?? '',
      content: json['content'] as String? ?? '',
      keywords: (json['keywords'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
      indexStatus: _mapIndexStatus(json['indexStatus'] as String? ?? ''),
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
    required this.scope,
    required this.ragMeta,
    required this.agentMode,
    required this.agent,
  });

  final String answer;
  final String explanation;
  final List<String> pipeline;
  final QueryRetrievalStats retrievalStats;
  final List<QueryCitation> citations;
  final QueryScope scope;
  final QueryRagMeta ragMeta;
  final bool agentMode;
  final TeamAgentSummary? agent;

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
      scope: QueryScope.fromJson(json['scope'] as Map<String, dynamic>? ?? const {}),
      ragMeta: QueryRagMeta.fromJson(json['ragMeta'] as Map<String, dynamic>? ?? const {}),
      agentMode: json['agentMode'] as bool? ?? false,
      agent: (json['agent'] as Map<String, dynamic>?) == null
          ? null
          : TeamAgentSummary.fromJson(json['agent'] as Map<String, dynamic>),
    );
  }
}

class QueryRetrievalStats {
  const QueryRetrievalStats({
    required this.queryMode,
    required this.candidateChunks,
    required this.returnedCitations,
    required this.publicLibraryHits,
    required this.privateLibraryHits,
  });

  final String queryMode;
  final int candidateChunks;
  final int returnedCitations;
  final int publicLibraryHits;
  final int privateLibraryHits;

  factory QueryRetrievalStats.fromJson(Map<String, dynamic> json) {
    return QueryRetrievalStats(
      queryMode: json['queryMode'] as String? ?? '',
      candidateChunks: json['candidateChunks'] as int? ?? 0,
      returnedCitations: json['returnedCitations'] as int? ?? 0,
      publicLibraryHits: json['publicLibraryHits'] as int? ?? 0,
      privateLibraryHits: json['privateLibraryHits'] as int? ?? 0,
    );
  }
}

class QueryScope {
  const QueryScope({
    required this.label,
    required this.groupName,
    required this.isolationNotice,
  });

  final String label;
  final String? groupName;
  final String isolationNotice;

  factory QueryScope.fromJson(Map<String, dynamic> json) {
    return QueryScope(
      label: json['label'] as String? ?? '',
      groupName: json['groupName'] as String?,
      isolationNotice: json['isolationNotice'] as String? ?? '',
    );
  }
}

class QueryRagMeta {
  const QueryRagMeta({
    required this.retrievalMode,
    required this.generationProviderTarget,
    required this.prototypeMode,
    required this.answerTraceable,
  });

  final String retrievalMode;
  final String generationProviderTarget;
  final String prototypeMode;
  final bool answerTraceable;

  factory QueryRagMeta.fromJson(Map<String, dynamic> json) {
    return QueryRagMeta(
      retrievalMode: json['retrievalMode'] as String? ?? '',
      generationProviderTarget: json['generationProviderTarget'] as String? ?? '',
      prototypeMode: json['prototypeMode'] as String? ?? '',
      answerTraceable: json['answerTraceable'] as bool? ?? false,
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
    required this.groupId,
    required this.isTeamAgent,
    required this.lastMessageAt,
  });

  final String id;
  final String title;
  final String type;
  final String lastMessage;
  final int unreadCount;
  final String? groupId;
  final bool isTeamAgent;
  final String lastMessageAt;

  factory ConversationSummary.fromJson(Map<String, dynamic> json) {
    final rawType = json['type'] as String? ?? '';
    return ConversationSummary(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      type: rawType == 'group' ? '群聊' : rawType == 'direct' ? '私信' : rawType == 'agent' ? '项目组Agent' : rawType,
      lastMessage: json['lastMessage'] as String? ?? '',
      unreadCount: json['unreadCount'] as int? ?? 0,
      groupId: json['groupId'] as String?,
      isTeamAgent: json['isTeamAgent'] as bool? ?? rawType == 'agent',
      lastMessageAt: json['lastMessageAt'] as String? ?? '',
    );
  }
}

class ChatAttachment {
  const ChatAttachment({
    required this.name,
    required this.path,
    required this.size,
    required this.mimeType,
    required this.extension,
  });

  final String name;
  final String path;
  final int size;
  final String mimeType;
  final String extension;

  factory ChatAttachment.fromJson(Map<String, dynamic> json) {
    return ChatAttachment(
      name: json['name'] as String? ?? '',
      path: json['path'] as String? ?? '',
      size: json['size'] as int? ?? 0,
      mimeType: json['mimeType'] as String? ?? '',
      extension: json['extension'] as String? ?? '',
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
    required this.readStatus,
    required this.messageType,
    required this.file,
  });

  final String id;
  final String conversationId;
  final String senderName;
  final String content;
  final String sentAt;
  final bool readStatus;
  final String messageType;
  final ChatAttachment? file;

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      conversationId: json['conversationId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? '',
      content: json['content'] as String? ?? '',
      sentAt: json['sentAt'] as String? ?? '',
      readStatus: json['readStatus'] as bool? ?? true,
      messageType: json['messageType'] as String? ?? 'text',
      file: (json['file'] as Map<String, dynamic>?) == null
          ? null
          : ChatAttachment.fromJson(json['file'] as Map<String, dynamic>),
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
    required this.parserTarget,
    required this.embeddingTarget,
    required this.vectorStoreTarget,
    required this.pipelineStage,
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
  final String parserTarget;
  final String embeddingTarget;
  final String vectorStoreTarget;
  final String pipelineStage;

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
      parserTarget: json['parserTarget'] as String? ?? '',
      embeddingTarget: json['embeddingTarget'] as String? ?? '',
      vectorStoreTarget: json['vectorStoreTarget'] as String? ?? '',
      pipelineStage: _mapPipelineStage(json['pipelineStage'] as String? ?? ''),
    );
  }
}

class SubscriptionOverview {
  const SubscriptionOverview({
    required this.planId,
    required this.planName,
    required this.priceLabel,
    required this.status,
    required this.statusLabel,
    required this.groupUsage,
    required this.documentUsage,
    required this.queryUsage,
    required this.planHighlights,
    required this.trialDays,
    required this.weeklyPrice,
    required this.monthlyPrice,
    required this.yearlyPrice,
    required this.groupsUsed,
    required this.groupsLimit,
    required this.privateDocumentsUsed,
    required this.privateDocumentsLimit,
    required this.dailyQueriesUsed,
    required this.dailyQueriesLimit,
    required this.latestOrder,
    required this.orderHistory,
  });

  final String planId;
  final String planName;
  final String priceLabel;
  final String status;
  final String statusLabel;
  final String groupUsage;
  final String documentUsage;
  final String queryUsage;
  final List<String> planHighlights;
  final int trialDays;
  final String weeklyPrice;
  final String monthlyPrice;
  final String yearlyPrice;
  final int groupsUsed;
  final int groupsLimit;
  final int privateDocumentsUsed;
  final int privateDocumentsLimit;
  final int dailyQueriesUsed;
  final int dailyQueriesLimit;
  final SubscriptionOrderSummary? latestOrder;
  final List<SubscriptionOrderSummary> orderHistory;

  factory SubscriptionOverview.fromJson(Map<String, dynamic> json) {
    final usage = json['usage'] as Map<String, dynamic>? ?? const {};
    final groups = usage['groups'] as Map<String, dynamic>? ?? const {};
    final privateDocuments = usage['privateDocuments'] as Map<String, dynamic>? ?? const {};
    final dailyQueries = usage['dailyQueries'] as Map<String, dynamic>? ?? const {};
    final pricing = json['pricing'] as Map<String, dynamic>? ?? const {};
    final plans = json['plans'] as List<dynamic>? ?? const [];
    final currentPlanId = json['currentPlanId'] as String? ?? '';
    final currentPlan = plans.whereType<Map<String, dynamic>>().firstWhere(
          (plan) => plan['id'] == currentPlanId,
          orElse: () => const {},
        );

    return SubscriptionOverview(
      planId: currentPlanId,
      planName: currentPlan['name'] as String? ?? '未设置套餐',
      priceLabel: currentPlan['priceLabel'] as String? ?? '--',
      status: json['status'] as String? ?? 'trial',
      statusLabel: json['statusLabel'] as String? ?? '试用中',
      groupUsage: '项目组 ${groups['used'] ?? 0} / ${groups['limit'] ?? 0}',
      documentUsage:
          '私有文件 ${privateDocuments['used'] ?? 0} / ${privateDocuments['limit'] ?? 0}',
      queryUsage: '今日查询 ${dailyQueries['used'] ?? 0} / ${dailyQueries['limit'] ?? 0}',
      planHighlights: (json['planHighlights'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      trialDays: json['trialDays'] as int? ?? 0,
      weeklyPrice: pricing['weekly'] as String? ?? '--',
      monthlyPrice: pricing['monthly'] as String? ?? '--',
      yearlyPrice: pricing['yearly'] as String? ?? '--',
      latestOrder: (json['latestOrder'] as Map<String, dynamic>?) == null
          ? null
          : SubscriptionOrderSummary.fromJson(json['latestOrder'] as Map<String, dynamic>),
      orderHistory: (json['orderHistory'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(SubscriptionOrderSummary.fromJson)
          .toList(),
      groupsUsed: groups['used'] as int? ?? 0,
      groupsLimit: groups['limit'] as int? ?? 0,
      privateDocumentsUsed: privateDocuments['used'] as int? ?? 0,
      privateDocumentsLimit: privateDocuments['limit'] as int? ?? 0,
      dailyQueriesUsed: dailyQueries['used'] as int? ?? 0,
      dailyQueriesLimit: dailyQueries['limit'] as int? ?? 0,
    );
  }
}

class SubscriptionOrderSummary {
  const SubscriptionOrderSummary({
    required this.id,
    required this.planType,
    required this.planLabel,
    required this.amount,
    required this.paidAt,
    required this.expiredAt,
  });

  final String id;
  final String planType;
  final String planLabel;
  final String amount;
  final String paidAt;
  final String expiredAt;

  factory SubscriptionOrderSummary.fromJson(Map<String, dynamic> json) {
    return SubscriptionOrderSummary(
      id: json['id'] as String? ?? '',
      planType: json['planType'] as String? ?? '',
      planLabel: json['planLabel'] as String? ?? json['planType'] as String? ?? '',
      amount: json['amount'] as String? ?? '',
      paidAt: json['paidAt'] as String? ?? '',
      expiredAt: json['expiredAt'] as String? ?? '',
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
    required this.activeContext,
    required this.roadmap,
    required this.architectureTargets,
    required this.activeTeamAgent,
  });

  final AppUser user;
  final List<ProjectGroup> groups;
  final List<KnowledgeDocument> documents;
  final List<ExtractionJob> extractJobs;
  final List<ConversationSummary> conversations;
  final SubscriptionOverview subscription;
  final QueryResult featuredQuery;
  final ActiveContext activeContext;
  final List<RoadmapItem> roadmap;
  final ArchitectureTargets architectureTargets;
  final TeamAgentSummary? activeTeamAgent;

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
      activeContext: ActiveContext.fromJson(json['activeContext'] as Map<String, dynamic>? ?? const {}),
      roadmap: (json['roadmap'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(RoadmapItem.fromJson)
          .toList(),
      architectureTargets:
          ArchitectureTargets.fromJson(json['architectureTargets'] as Map<String, dynamic>? ?? const {}),
      activeTeamAgent: (json['activeTeamAgent'] as Map<String, dynamic>?) == null
          ? null
          : TeamAgentSummary.fromJson(json['activeTeamAgent'] as Map<String, dynamic>),
    );
  }
}

class ActiveContext {
  const ActiveContext({
    required this.groupName,
    required this.queryScopeLabel,
    required this.isolationNotice,
    required this.agentId,
    required this.agentName,
    required this.agentCapabilities,
    required this.knowledgeScopeLabel,
  });

  final String? groupName;
  final String queryScopeLabel;
  final String isolationNotice;
  final String? agentId;
  final String? agentName;
  final List<String> agentCapabilities;
  final String knowledgeScopeLabel;

  factory ActiveContext.fromJson(Map<String, dynamic> json) {
    return ActiveContext(
      groupName: json['groupName'] as String?,
      queryScopeLabel: json['queryScopeLabel'] as String? ?? '',
      isolationNotice: json['isolationNotice'] as String? ?? '',
      agentId: json['agentId'] as String?,
      agentName: json['agentName'] as String?,
      agentCapabilities: (json['agentCapabilities'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      knowledgeScopeLabel: json['knowledgeScopeLabel'] as String? ?? '',
    );
  }
}

class TeamAgentSummary {
  const TeamAgentSummary({
    required this.id,
    required this.name,
    required this.groupId,
    required this.capabilities,
    required this.defaultConversationId,
    required this.retrievalScope,
  });

  final String id;
  final String name;
  final String groupId;
  final List<String> capabilities;
  final String? defaultConversationId;
  final String retrievalScope;

  factory TeamAgentSummary.fromJson(Map<String, dynamic> json) {
    return TeamAgentSummary(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      groupId: json['groupId'] as String? ?? '',
      capabilities: (json['capabilities'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(),
      defaultConversationId: json['defaultConversationId'] as String?,
      retrievalScope: json['retrievalScope'] as String? ?? '',
    );
  }
}

class RoadmapItem {
  const RoadmapItem({
    required this.version,
    required this.title,
    required this.deadline,
    required this.ragFocus,
  });

  final String version;
  final String title;
  final String deadline;
  final String ragFocus;

  factory RoadmapItem.fromJson(Map<String, dynamic> json) {
    return RoadmapItem(
      version: json['version'] as String? ?? '',
      title: json['title'] as String? ?? '',
      deadline: json['deadline'] as String? ?? '',
      ragFocus: json['ragFocus'] as String? ?? '',
    );
  }
}

class ArchitectureTargets {
  const ArchitectureTargets({
    required this.generationProviderTarget,
    required this.vectorStoreTarget,
    required this.retrievalMode,
    required this.parserTarget,
    required this.deliveryMode,
  });

  final String generationProviderTarget;
  final String vectorStoreTarget;
  final String retrievalMode;
  final String parserTarget;
  final String deliveryMode;

  factory ArchitectureTargets.fromJson(Map<String, dynamic> json) {
    return ArchitectureTargets(
      generationProviderTarget: json['generationProviderTarget'] as String? ?? '',
      vectorStoreTarget: json['vectorStoreTarget'] as String? ?? '',
      retrievalMode: json['retrievalMode'] as String? ?? '',
      parserTarget: json['parserTarget'] as String? ?? '',
      deliveryMode: json['deliveryMode'] as String? ?? '',
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

String _mapPipelineStage(String value) {
  switch (value) {
    case 'indexed':
      return '已完成向量化';
    case 'extracting':
      return '文字抽取中';
    case 'ocr':
      return 'OCR处理中';
    case 'chunking':
      return '结构化切分中';
    case 'vectorizing':
      return '向量化中';
    case 'queued':
      return '等待入库';
    default:
      return value;
  }
}
