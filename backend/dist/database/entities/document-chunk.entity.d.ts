export declare class DocumentChunkEntity {
    id: string;
    documentId: string;
    teamId: string | null;
    libraryType: 'public' | 'private';
    title: string;
    chapterTitle: string | null;
    articleRef: string | null;
    pageLabel: string | null;
    content: string;
    keywords: string[];
    chunkIndex: number;
    indexStatus: 'ready' | 'processing' | 'failed';
    tokenCount: number;
    embedding: number[] | null;
    createdAt: Date;
}
