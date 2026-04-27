export declare class TextExtractionService {
    private getAbsolutePath;
    extractText(sourcePath: string, fileType: string): Promise<string>;
    private extractPdf;
    private extractDocx;
}
