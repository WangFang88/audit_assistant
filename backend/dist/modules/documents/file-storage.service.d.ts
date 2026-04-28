export type SavedFileRecord = {
    sourcePath: string;
    originalName: string;
    extension: string;
};
export declare class FileStorageService {
    private readonly allowedChatFileExtensions;
    private readonly allowedChatMimeTypes;
    private getUploadRoot;
    sanitizeFileName(fileName: string): string;
    private writeStoredFile;
    saveFile(options: {
        file: Express.Multer.File;
        libraryType: 'public' | 'private';
        documentId: string;
        groupId?: string;
    }): SavedFileRecord;
    private assertAllowedChatFile;
    saveChatFile(options: {
        file: Express.Multer.File;
        conversationId: string;
        messageId: string;
        conversationType: 'group' | 'direct';
    }): SavedFileRecord;
    removeChatConversationFiles(conversationType: 'group' | 'direct', conversationId: string): void;
}
