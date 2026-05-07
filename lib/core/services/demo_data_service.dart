import '../models/app_models.dart';

class DemoDataService {
  const DemoDataService();

  AppUser getCurrentUser() {
    return const AppUser(
      id: 'user-1',
      name: '审计专员',
      phone: '13800138000',
      role: '项目组长',
      trialEndsAt: '2026-05-01',
    );
  }

  List<ProjectGroup> getGroups() {
    return const [
      ProjectGroup(
        id: 'group-1',
        name: '某区财政局审计组',
        organizationName: '某区财政局',
        memberCount: 4,
        privateDocumentCount: 2,
        lastQueryAt: '今天 16:20',
      ),
    ];
  }

  List<KnowledgeDocument> getDocuments() {
    return const [
      KnowledgeDocument(
        id: 'doc-1',
        title: '某区财政专项资金管理办法',
        libraryType: '公共库',
        extractionMode: '文字抽取',
        indexStatus: '已建索引',
        chunkCount: 18,
        fileType: 'PDF',
        chunkStrategy: '结构优先切分',
        parserTarget: 'multimodal-parser',
        embeddingTarget: 'bge-large-zh',
        vectorStoreTarget: 'pgvector',
        pipelineStage: '已完成向量化',
        sourcePath: '/policies/public/fiscal-rules.pdf',
        uploadedAt: '2026-04-25 10:00',
      ),
      KnowledgeDocument(
        id: 'doc-2',
        title: '某区财政局内部采购管理制度',
        libraryType: '私有库',
        extractionMode: '文字抽取',
        indexStatus: '已建索引',
        chunkCount: 12,
        fileType: 'DOCX',
        chunkStrategy: '结构优先切分',
        parserTarget: 'multimodal-parser',
        embeddingTarget: 'bge-large-zh',
        vectorStoreTarget: 'pgvector',
        pipelineStage: '已完成向量化',
        sourcePath: '/groups/group-1/purchase-guideline.docx',
        uploadedAt: '2026-04-25 14:00',
      ),
      KnowledgeDocument(
        id: 'doc-3',
        title: '某医院设备管理台账扫描件',
        libraryType: '私有库',
        extractionMode: 'OCR',
        indexStatus: '处理中',
        chunkCount: 0,
        fileType: 'PDF',
        chunkStrategy: '长度回退切分',
        parserTarget: 'multimodal-parser',
        embeddingTarget: 'bge-large-zh',
        vectorStoreTarget: 'pgvector',
        pipelineStage: 'OCR处理中',
        sourcePath: '/groups/group-1/equipment-scan.pdf',
        uploadedAt: '2026-04-25 15:30',
      ),
    ];
  }

  QueryResult search(String question) {
    final bool procurement = question.contains('采购');
    final bool fund = question.contains('资金');

    final citations = [
      QueryCitation(
        title: procurement ? '某区财政局内部采购管理制度' : '某区财政专项资金管理办法',
        libraryType: procurement ? '私有库' : '公共库',
        score: 0.93,
        matchedChunk: procurement
            ? '第四条：项目组内部采购须履行审批、比价、验收与留痕。'
            : '第十二条：专项资金使用应符合预算用途，不得擅自改变资金性质。',
        reason: '已基于已切分文本块完成关键词和语义融合检索。',
        articleRef: procurement ? '第四条' : '第十二条',
        chapterTitle: procurement ? '第一章 总则' : '第二章 资金使用',
        pageLabel: procurement ? '第 2 页' : '第 6 页',
      ),
      QueryCitation(
        title: fund ? '某区财政专项资金管理办法' : '财政监督检查工作规范',
        libraryType: '公共库',
        score: 0.88,
        matchedChunk: fund
            ? '第十五条：专项资金支出应专款专用，并留存完整依据。'
            : '第八条：审计取证应保留审批、执行、验收全链路证据。',
        reason: '先按库范围和元数据过滤，再从索引中命中相关条款。',
        articleRef: fund ? '第十五条' : '第八条',
        chapterTitle: fund ? '第二章 资金使用' : '第二章 监督检查',
        pageLabel: fund ? '第 8 页' : '第 4 页',
      ),
    ];

    return QueryResult(
      answer: '系统已优先检索公共库与当前项目组私有库中已抽取、已切分、已建索引的文本块，并返回最相关的制度依据。',
      explanation: '当前方案不会在查询时解析原始大文件，超大文件会在导入阶段异步抽取与索引，因此查询响应更稳定。',
      pipeline: const ['范围过滤', '关键词召回', '语义召回', '融合重排', '阿里千问生成（目标）'],
      retrievalStats: const QueryRetrievalStats(
        queryMode: '关键词 + 语义融合',
        candidateChunks: 4,
        returnedCitations: 2,
        publicLibraryHits: 1,
        privateLibraryHits: 1,
      ),
      citations: citations,
      similarCases: const [
        QueryCitation(
          title: '某区学校食堂采购审计案例',
          libraryType: '全国案例库',
          score: 0.84,
          matchedChunk: '问题表现：采购审批不完整、验收资料缺失，导致审计中无法完整还原采购流程。',
          reason: '与当前问题在采购审批与审计取证方面具有较高相似度。',
          articleRef: '案例要点一',
          chapterTitle: '问题定性',
          pageLabel: '第 3 页',
        ),
        QueryCitation(
          title: '某医院设备采购审计整改案例',
          libraryType: '地方案例库',
          score: 0.79,
          matchedChunk: '审计发现合同、验收、付款凭证未形成闭环留痕，整改要求补齐全流程证据。',
          reason: '与当前问题在合同、验收和付款留痕方面具有相似风险。',
          articleRef: '案例要点二',
          chapterTitle: '整改情况',
          pageLabel: '第 5 页',
        ),
      ],
      scope: const QueryScope(
        label: '公共库 + 当前项目组私有库',
        groupName: '某区财政局审计组',
        isolationNotice: '仅检索当前项目组私有库，不跨项目组读取私有资料。',
      ),
      ragMeta: const QueryRagMeta(
        retrievalMode: 'hybrid',
        generationProviderTarget: 'Qwen',
        prototypeMode: 'mock',
        answerTraceable: true,
      ),
      agentMode: true,
      agent: TeamAgentSummary(
        id: 'team-agent-group-1',
        name: '某区财政局审计组 Agent',
        groupId: 'group-1',
        capabilities: const ['query', 'article_explanation'],
        defaultConversationId: 'conv-agent-1',
        retrievalScope: 'public_plus_group_private',
      ),
    );
  }

  List<ConversationSummary> getConversations() {
    return const [
      ConversationSummary(
        id: 'conv-agent-1',
        title: '某区财政局审计组 Agent',
        type: '项目组Agent',
        lastMessage: '已收到本次提问。当前项目组 Agent 将在公共库与本组私有库范围内完成检索。',
        unreadCount: 0,
        groupId: 'group-1',
        isTeamAgent: true,
        lastMessageAt: '2026-04-25 16:55',
      ),
      ConversationSummary(
        id: 'conv-group-1',
        title: '某区财政局审计组群聊',
        type: '群聊',
        lastMessage: '请同步采购抽查结果。',
        unreadCount: 2,
        groupId: 'group-1',
        isTeamAgent: false,
        lastMessageAt: '2026-04-25 16:40',
      ),
      ConversationSummary(
        id: 'conv-direct-1',
        title: '与法规顾问的私信',
        type: '私信',
        lastMessage: '我已整理出相关条款。',
        unreadCount: 0,
        groupId: null,
        isTeamAgent: false,
        lastMessageAt: '2026-04-25 15:20',
      ),
    ];
  }

  SubscriptionOverview getSubscriptionOverview() {
    return const SubscriptionOverview(
      planId: 'free',
      planName: '免费版',
      priceLabel: '¥0 / 1天试用',
      status: 'trial',
      statusLabel: '试用中',
      groupUsage: '项目组 1 / 1',
      documentUsage: '私有文件 2 / 2',
      queryUsage: '今日查询 6 / 10',
      planHighlights: [
        '免费版默认可创建 1 个项目组',
        '私有库文件最多 2 个',
        '每日 RAG 查询次数 10 次',
        '案例查询能力需订阅后开启',
      ],
      trialDays: 1,
      trialEndsAt: '2026-05-01',
      weeklyPrice: '¥70 / 周',
      monthlyPrice: '¥200 / 月',
      yearlyPrice: '¥2000 / 年',
      groupsUsed: 1,
      groupsLimit: 1,
      privateDocumentsUsed: 2,
      privateDocumentsLimit: 2,
      dailyQueriesUsed: 6,
      dailyQueriesLimit: 10,
      latestOrder: null,
      effectiveOrder: null,
      orderHistory: [],
      libraryAccess: [],
    );
  }
}
