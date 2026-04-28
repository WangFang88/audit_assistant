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
    getUploadRoot() {
        return (0, node_path_1.join)(process.cwd(), '.data', 'uploads');
    }
    sanitizeFileName(fileName) {
        return fileName.replace(/[^a-zA-Z0-9._-\u4e00-\u9fa5]+/g, '-');
    }
    writeStoredFile(folder, file, logicalPath) {
        const sanitizedFileName = this.sanitizeFileName(file.originalname || 'upload.bin');
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
        const logicalPath = options.libraryType === 'private'
            ? `/files/teams/${options.groupId}/${options.documentId}/original${(0, node_path_1.extname)(this.sanitizeFileName(options.file.originalname || 'upload.bin')) || '.bin'}`
            : `/files/public/${options.documentId}/original${(0, node_path_1.extname)(this.sanitizeFileName(options.file.originalname || 'upload.bin')) || '.bin'}`;
        return this.writeStoredFile(folder, options.file, logicalPath);
    }
    saveChatFile(options) {
        const channel = options.conversationType === 'group' ? 'groups' : 'direct';
        const folder = (0, node_path_1.join)(this.getUploadRoot(), 'chat', channel, options.conversationId, options.messageId);
        const extension = (0, node_path_1.extname)(this.sanitizeFileName(options.file.originalname || 'upload.bin')) || '.bin';
        const logicalPath = `/files/chat/${channel}/${options.conversationId}/${options.messageId}/original${extension}`;
        return this.writeStoredFile(folder, options.file, logicalPath);
    }
};
exports.FileStorageService = FileStorageService;
exports.FileStorageService = FileStorageService = __decorate([
    (0, common_1.Injectable)()
], FileStorageService);
//# sourceMappingURL=file-storage.service.js.map