export declare class DocumentEntity {
    id: string;
    title: string;
    fileName: string;
    filePath: string;
    fileType: string;
    libraryType: 'public' | 'private';
    teamId: string | null;
    uploadedBy: string;
    uploadSource: string | null;
    indexStatus: string;
    extractionMode: string | null;
    parserTarget: string;
    embeddingTarget: string;
    vectorStoreTarget: string;
    chunkCount: number;
    rawTextLength: number;
    uploadedAt: Date;
    indexedAt: Date | null;
    deletedAt: Date | null;
}
