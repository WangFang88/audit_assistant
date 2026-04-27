export declare class DocumentExtractionJobEntity {
    id: string;
    documentId: string;
    teamId: string | null;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    stage: 'extract' | 'ocr' | 'chunk' | 'index';
    progress: number;
    errorMessage: string | null;
    startedAt: Date;
    finishedAt: Date | null;
}
