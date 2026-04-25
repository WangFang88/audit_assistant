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
}

class KnowledgeDocument {
  const KnowledgeDocument({
    required this.id,
    required this.title,
    required this.libraryType,
    required this.extractionMode,
    required this.indexStatus,
    required this.chunkCount,
  });

  final String id;
  final String title;
  final String libraryType;
  final String extractionMode;
  final String indexStatus;
  final int chunkCount;
}

class QueryCitation {
  const QueryCitation({
    required this.title,
    required this.libraryType,
    required this.score,
    required this.matchedChunk,
    required this.reason,
  });

  final String title;
  final String libraryType;
  final double score;
  final String matchedChunk;
  final String reason;
}

class QueryResult {
  const QueryResult({
    required this.answer,
    required this.explanation,
    required this.pipeline,
    required this.citations,
  });

  final String answer;
  final String explanation;
  final List<String> pipeline;
  final List<QueryCitation> citations;
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
}
