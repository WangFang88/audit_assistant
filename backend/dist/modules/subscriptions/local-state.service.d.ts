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
type PersistedUsageSnapshot = {
    groups: number;
    privateDocuments: number;
    dailyQueries: number;
};
type PersistedState = {
    groups?: PersistedGroupRecord[];
    members?: PersistedMemberRecord[];
    documents?: PersistedDocumentRecord[];
    usage?: PersistedUsageSnapshot;
};
export declare class LocalStateService {
    private readonly filePath;
    readState(): PersistedState;
    saveGroups(groups: PersistedGroupRecord[], members: PersistedMemberRecord[]): void;
    saveDocuments(documents: PersistedDocumentRecord[]): void;
    saveUsage(usage: PersistedUsageSnapshot): void;
    private writeState;
}
export {};
