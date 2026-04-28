"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
let FileStorageService = class FileStorageService {
    constructor() {
        this.allowedChatFileExtensions = new Set(['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg']);
        this.allowedChatMimeTypes = new Set([
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/octet-stream',
            'image/png',
            'image/jpeg',
            'image/jpg',
        ]);
    }
    getUploadRoot() {
        return (0, node_path_1.join)(process.cwd(), '.data', 'uploads');
    }
    normalizeOriginalFileName(fileName) {
        if (fileName.length === 0) {
            return 'upload.bin';
        }
        try {
            const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
            if (decoded.length > 0 && !decoded.includes('�')) {
                return decoded;
            }
        }
        catch (_) {
        }
        return fileName;
    }
    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9._-\u4e00-\u9fa5]+/g, '-');
    }
    writeStoredFile(folder, file, logicalPath) {
        const sanitizedFileName = this.sanitizeFileName(this.normalizeOriginalFileName(file.originalname || 'upload.bin'));
        const extension = (0, node_path_1.extname)(sanitizedFileName) || '.bin';
        (0, node_fs_1.mkdirSync)(folder, { recursive: true });
        const storedFileName = `original${extension}`;
        const storedFilePath = (0, node_path_1.join)(folder, storedFileName);
        (0, node_fs_1.writeFileSync)(storedFilePath, file.buffer);
        return {
            sourcePath: logicalPath.replace(/\\/g, '/'),
            originalName: sanitizedFileName,
            extension,
        };
    }
    saveFile(options) {
        const folder = options.libraryType === 'private'
            ? (0, node_path_1.join)(this.getUploadRoot(), 'teams', options.groupId ?? 'unknown', options.documentId)
            : (0, node_path_1.join)(this.getUploadRoot(), 'public', options.documentId);
        const normalizedFileName = this.normalizeOriginalFileName(options.file.originalname || 'upload.bin');
        const logicalPath = options.libraryType === 'private'
            ? `/files/teams/${options.groupId}/${options.documentId}/original${(0, node_path_1.extname)(this.sanitizeFileName(normalizedFileName)) || '.bin'}`
            : `/files/public/${options.documentId}/original${(0, node_path_1.extname)(this.sanitizeFileName(normalizedFileName)) || '.bin'}`;
        return this.writeStoredFile(folder, options.file, logicalPath);
    }
    assertAllowedChatFile(file) {
        const extension = ((0, node_path_1.extname)(this.sanitizeFileName(this.normalizeOriginalFileName(file.originalname || 'upload.bin'))) || '.bin').toLowerCase();
        const mimeType = (file.mimetype || '').toLowerCase();
        if (!this.allowedChatFileExtensions.has(extension)) {
            throw new common_1.BadRequestException('当前仅支持 PDF、DOCX、XLSX、PNG、JPG、JPEG 文件');
        }
        if (mimeType.length > 0 && !this.allowedChatMimeTypes.has(mimeType)) {
            throw new common_1.BadRequestException('当前仅支持 PDF、DOCX、XLSX、PNG、JPG、JPEG 文件');
        }
    }
    saveChatFile(options) {
        this.assertAllowedChatFile(options.file);
        const channel = options.conversationType === 'group' ? 'groups' : 'direct';
        const folder = (0, node_path_1.join)(this.getUploadRoot(), 'chat', channel, options.conversationId, options.messageId);
        const extension = (0, node_path_1.extname)(this.sanitizeFileName(this.normalizeOriginalFileName(options.file.originalname || 'upload.bin'))) || '.bin';
        const logicalPath = `/files/chat/${channel}/${options.conversationId}/${options.messageId}/original${extension}`;
        return this.writeStoredFile(folder, options.file, logicalPath);
    }
    removeChatMessageFile(sourcePath) {
        const normalizedPath = sourcePath.replace(/^\/files\//, '').replace(/\//g, '\\');
        const filePath = (0, node_path_1.join)(this.getUploadRoot(), normalizedPath);
        if ((0, node_fs_1.existsSync)(filePath)) {
            (0, node_fs_1.unlinkSync)(filePath);
        }
    }
    removeChatConversationFiles(conversationType, conversationId) {
        const channel = conversationType === 'group' ? 'groups' : 'direct';
        const folder = (0, node_path_1.join)(this.getUploadRoot(), 'chat', channel, conversationId);
        if ((0, node_fs_1.existsSync)(folder)) {
            (0, node_fs_1.rmSync)(folder, { recursive: true, force: true });
        }
    }
};
exports.FileStorageService = FileStorageService;
exports.FileStorageService = FileStorageService = __decorate([
    (0, common_1.Injectable)()
], FileStorageService);
//# sourceMappingURL=file-storage.service.js.map