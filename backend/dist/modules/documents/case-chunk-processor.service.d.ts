import { XlsxSheetData } from './text-extraction.service';
import { LibraryType } from './library-type';
interface DocumentRecord {
    id: string;
    title: string;
    libraryType: LibraryType;
    region: string | null;
    sourcePath: string;
    fileName: string;
    uploadedBy: string;
    chunkCount: number;
    indexStatus: string;
    extractionMode: string;
    uploadedAt: string;
    groupId: string | null;
    fileType: string;
}
interface DocumentChunkRecord {
    id: string;
    documentId: string;
    groupId: string | null;
    libraryType: LibraryType;
    region: string | null;
    title: string;
    chapterTitle: string;
    articleRef: string;
    pageLabel: string;
    content: string;
    keywords: string[];
    indexStatus: 'ready';
}
export declare class CaseChunkProcessorService {
    private readonly logger;
    private readonly COLUMN_PATTERNS;
    private buildImportedChunkId;
    buildXlsxCaseChunks(document: DocumentRecord, sheets: XlsxSheetData[]): DocumentChunkRecord[];
    private detectColumnTypes;
    private assembleContent;
    private extractArticleRef;
    private extractOrgName;
    buildTextCaseChunks(document: DocumentRecord, rawText: string): DocumentChunkRecord[];
    private mergeShortSegments;
    private buildChunksFromSegments;
    private extractTitleKeywords;
    private extractContentKeywords;
    private extractNgrams;
    private splitLongContent;
}
export {};
