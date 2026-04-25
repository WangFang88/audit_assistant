import { DocumentsService, ImportDocumentDto } from './documents.service';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    listDocuments(groupId?: string): {
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
    }[];
    listExtractionJobs(groupId?: string): {
        id: string;
        documentId: string;
        groupId: string | null;
        status: "processing" | "queued" | "completed";
        stage: "extract" | "ocr" | "chunk" | "index";
        progress: number;
        startedAt: string;
    }[];
    importDocument(dto: ImportDocumentDto): {
        id: string;
        title: string;
        libraryType: "public" | "private";
        sourcePath: string;
        groupId: string | null;
        fileType: "pdf" | "docx" | "xlsx" | "image";
        extractionMode: string;
        indexStatus: string;
        chunkStrategy: string;
        notes: string;
    };
}
