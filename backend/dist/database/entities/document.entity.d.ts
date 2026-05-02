export declare class DocumentEntity {
    id: string;
    title: string;
    fileName: string;
    filePath: string;
    fileType: string;
    libraryType: 'regulation' | 'local_policy' | 'national_case' | 'local_case' | 'industry' | 'private';
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
