export type SavedFileRecord = {
    sourcePath: string;
    originalName: string;
    extension: string;
};
export declare class FileStorageService {
    private getUploadRoot;
    sanitizeFileName(fileName: string): string;
    private writeStoredFile;
    saveFile(options: {
        file: Express.Multer.File;
        libraryType: 'public' | 'private';
        documentId: string;
        groupId?: string;
    }): SavedFileRecord;
    saveChatFile(options: {
        file: Express.Multer.File;
        conversationId: string;
        messageId: string;
        conversationType: 'group' | 'direct';
    }): SavedFileRecord;
}
