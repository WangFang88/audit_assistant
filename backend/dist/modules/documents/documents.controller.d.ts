import { DocumentsService, ImportDocumentDto } from './documents.service';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    listDocuments(groupId?: string): Promise<{
        id: string;
        title: string;
        libraryType: "public" | "private";
        sourcePath: string;
        fileName: string;
        uploadedBy: string;
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
    }[]>;
    listExtractionJobs(groupId?: string): {
        id: string;
        documentId: string;
        groupId: string | null;
        status: "processing" | "queued" | "completed";
        stage: "extract" | "ocr" | "chunk" | "index";
        progress: number;
        startedAt: string;
    }[];
    listDocumentChunks(documentId: string): {
        id: string;
        documentId: string;
        groupId: string | null;
        libraryType: "public" | "private";
        title: string;
        chapterTitle: string;
        articleRef: string;
        pageLabel: string;
        content: string;
        keywords: string[];
        indexStatus: "ready" | "processing";
    }[];
    importDocument(file: Express.Multer.File | undefined, dto: ImportDocumentDto): Promise<{
        notes: string;
        id: string;
        title: string;
        libraryType: "public" | "private";
        sourcePath: string;
        fileName: string;
        uploadedBy: string;
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
    }>;
}
