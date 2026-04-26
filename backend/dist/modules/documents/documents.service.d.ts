import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
declare class ImportDocumentDto {
    title: string;
    libraryType: 'public' | 'private';
    rawText?: string;
    groupId?: string;
}
type DocumentRecord = {
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
type ExtractJobRecord = {
    id: string;
    documentId: string;
    groupId: string | null;
    status: 'processing' | 'queued' | 'completed';
    stage: 'extract' | 'ocr' | 'chunk' | 'index';
    progress: number;
    startedAt: string;
};
type DocumentChunkRecord = {
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
export declare class DocumentsService {
    private readonly authService;
    private readonly groupsService;
    private readonly localStateService;
    private readonly subscriptionsService;
    constructor(authService: AuthService, groupsService: GroupsService, localStateService: LocalStateService, subscriptionsService: SubscriptionsService);
    private readonly documents;
    private readonly extractJobs;
    private readonly chunks;
    private assertAdminPublicLibraryOnly;
    private assertAdminCanAccessDocument;
    listDocuments(groupId?: string): DocumentRecord[];
    listExtractionJobs(groupId?: string): ExtractJobRecord[];
    getReadyChunks(groupId?: string): DocumentChunkRecord[];
    listDocumentChunks(documentId: string): DocumentChunkRecord[];
    getDocumentById(documentId: string): DocumentRecord;
    private buildChunksFromRawText;
    private buildChunksForDocument;
    private getUploadRoot;
    private sanitizeFileName;
    private getFileTypeFromName;
    private saveUploadedFile;
    importDocument(dto: ImportDocumentDto, file?: Express.Multer.File): {
        notes: string;
        id: string;
        title: string;
        libraryType: "public" | "private";
        sourcePath: string;
        chunkCount: number;
        indexStatus: "ready" | "processing" | "queued";
        extractionMode: "text" | "ocr";
        uploadedAt: string;
        groupId: string | null;
        fileType: "pdf" | "docx" | "xlsx" | "image";
        chunkStrategy: "structure-first" | "length-fallback";
        parserTarget: "multimodal-parser";
        embeddingTarget: "bge-large-zh";
        vectorStoreTarget: "pgvector";
        pipelineStage: "indexed" | "extracting" | "ocr" | "chunking" | "vectorizing" | "queued";
    };
    removeGroupDocuments(groupId: string): void;
    getLibraryScopeSummary(groupId?: string): {
        scopeMode: string;
        includesPublicLibrary: boolean;
        includesPrivateLibrary: boolean;
        publicDocumentCount: number;
        privateDocumentCount: number;
    };
}
export { ImportDocumentDto };
