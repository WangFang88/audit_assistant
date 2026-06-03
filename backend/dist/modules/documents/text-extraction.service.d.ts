export interface XlsxSheetData {
    sheetName: string;
    headers: string[];
    rows: Record<string, string>[];
}
export declare class TextExtractionService {
    private readonly logger;
    private getAbsolutePath;
    extractText(sourcePath: string, fileType: string): Promise<string>;
    private extractPdf;
    private extractDocx;
    private extractXlsx;
    extractXlsxStructured(sourcePath: string): Promise<XlsxSheetData[]>;
    private buildMergeMapFromSheet;
}
