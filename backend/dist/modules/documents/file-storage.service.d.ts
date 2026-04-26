export declare class FileStorageService {
    private getUploadRoot;
    sanitizeFileName(fileName: string): string;
    saveFile(options: {
        file: Express.Multer.File;
        libraryType: 'public' | 'private';
        documentId: string;
        groupId?: string;
    }): {
        sourcePath: string;
        originalName: string;
    };
}
