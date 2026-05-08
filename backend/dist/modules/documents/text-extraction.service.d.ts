export declare class TextExtractionService {
    private readonly logger;
    private getAbsolutePath;
    extractText(sourcePath: string, fileType: string): Promise<string>;
    private extractPdf;
    private extractDocx;
    private extractXlsx;
}
