type PersistedGroupRecord = {
    id: string;
    name: string;
    organizationName: string;
    ownerUserId: string;
    memberCount: number;
    privateDocumentCount: number;
    lastQueryAt: string | null;
};
type PersistedMemberRecord = {
    id: string;
    groupId: string;
    userId: string;
    name: string;
    phone: string;
    role: 'leader' | 'member';
};
type PersistedDocumentRecord = {
    id: string;
    title: string;
    libraryType: 'public' | 'private';
    sourcePath: string;
    chunkCount: number;
    indexStatus: 'ready' | 'processing' | 'queued';
    extractionMode: 'text' | 'ocr';
    uploadedAt: string;
    groupId: string | null;
    fileType: 'pdf' | 'docx' | 'xlsx' | 'image';
    chunkStrategy: 'structure-first' | 'length-fallback';
    parserTarget: 'multimodal-parser';
    embeddingTarget: 'bge-large-zh';
    vectorStoreTarget: 'pgvector';
    pipelineStage: 'indexed' | 'extracting' | 'ocr' | 'chunking' | 'vectorizing' | 'queued';
};
type PersistedChunkRecord = {
    id: string;
    documentId: string;
    groupId: string | null;
    libraryType: 'public' | 'private';
    title: string;
    chapterTitle: string;
    articleRef: string;
    pageLabel: string;
    content: string;
    keywords: string[];
    indexStatus: 'ready' | 'processing';
};
type PersistedUsageSnapshot = {
    groups: number;
    privateDocuments: number;
    dailyQueries: number;
    dailyQueryDate: string;
};
type PersistedConversationRecord = {
    id: string;
    type: 'group' | 'direct' | 'agent';
    title: string;
    groupId: string | null;
    unreadCount?: number;
    lastMessage?: string;
};
type PersistedTeamAgentRecord = {
    id: string;
    groupId: string;
    name: string;
    status: 'active' | 'deleted';
    capabilities: string[];
    createdAt: string;
    defaultConversationId: string | null;
    config: {
        retrievalScope: 'public_plus_group_private';
    };
};
type PersistedMessageRecord = {
    id: string;
    conversationId: string;
    senderUserId?: string;
    receiverUserId?: string | null;
    senderName: string;
    content: string;
    sentAt: string;
    readStatus?: boolean;
};
type PersistedUserRecord = {
    id: string;
    name: string;
    phone: string;
    role: 'admin' | 'member';
    trialEndsAt: string;
    password?: string;
    passwordHash?: string;
};
type PersistedQueryLogRecord = {
    id: string;
    userId: string;
    teamId: string | null;
    queryText: string;
    queriedAt: string;
    consumedQuota: number;
};
type PersistedSubscriptionRecord = {
    id: string;
    userId: string;
    planType: 'free' | 'weekly' | 'monthly' | 'yearly';
    amount: string;
    paidAt: string;
    expiredAt: string;
};
type PersistedState = {
    groups?: PersistedGroupRecord[];
    members?: PersistedMemberRecord[];
    documents?: PersistedDocumentRecord[];
    chunks?: PersistedChunkRecord[];
    usage?: PersistedUsageSnapshot;
    conversations?: PersistedConversationRecord[];
    messages?: PersistedMessageRecord[];
    users?: PersistedUserRecord[];
    queryLogs?: PersistedQueryLogRecord[];
    subscriptions?: PersistedSubscriptionRecord[];
    teamAgents?: PersistedTeamAgentRecord[];
};
export declare class LocalStateService {
    private readonly filePath;
    readState(): PersistedState;
    saveGroups(groups: PersistedGroupRecord[], members: PersistedMemberRecord[]): void;
    saveDocuments(documents: PersistedDocumentRecord[]): void;
    saveChunks(chunks: PersistedChunkRecord[]): void;
    saveUsage(usage: PersistedUsageSnapshot): void;
    saveChatState(conversations: PersistedConversationRecord[], messages: PersistedMessageRecord[]): void;
    saveUsers(users: PersistedUserRecord[]): void;
    saveQueryLogs(queryLogs: PersistedQueryLogRecord[]): void;
    saveSubscriptions(subscriptions: PersistedSubscriptionRecord[]): void;
    saveTeamAgents(teamAgents: PersistedTeamAgentRecord[]): void;
    private writeState;
}
export {};
