import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export type SavedFileRecord = {
  sourcePath: string;
  originalName: string;
  extension: string;
};

@Injectable()
export class FileStorageService {
  private readonly allowedChatFileExtensions = new Set(['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg']);
  private readonly allowedChatMimeTypes = new Set([
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

  private getUploadRoot() {
    return join(process.cwd(), '.data', 'uploads');
  }

  sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-\u4e00-\u9fa5]+/g, '-');
  }

  private writeStoredFile(folder: string, file: Express.Multer.File, logicalPath: string): SavedFileRecord {
    const sanitizedFileName = this.sanitizeFileName(file.originalname || 'upload.bin');
    const extension = extname(sanitizedFileName) || '.bin';
    mkdirSync(folder, { recursive: true });

    const storedFileName = `original${extension}`;
    const storedFilePath = join(folder, storedFileName);
    writeFileSync(storedFilePath, file.buffer);

    return {
      sourcePath: logicalPath.replace(/\\/g, '/'),
      originalName: sanitizedFileName,
      extension,
    };
  }

  saveFile(options: {
    file: Express.Multer.File;
    libraryType: 'public' | 'private';
    documentId: string;
    groupId?: string;
  }) {
    const folder = options.libraryType === 'private'
      ? join(this.getUploadRoot(), 'teams', options.groupId ?? 'unknown', options.documentId)
      : join(this.getUploadRoot(), 'public', options.documentId);
    const logicalPath = options.libraryType === 'private'
      ? `/files/teams/${options.groupId}/${options.documentId}/original${extname(this.sanitizeFileName(options.file.originalname || 'upload.bin')) || '.bin'}`
      : `/files/public/${options.documentId}/original${extname(this.sanitizeFileName(options.file.originalname || 'upload.bin')) || '.bin'}`;

    return this.writeStoredFile(folder, options.file, logicalPath);
  }

  private assertAllowedChatFile(file: Express.Multer.File) {
    const extension = (extname(this.sanitizeFileName(file.originalname || 'upload.bin')) || '.bin').toLowerCase();
    const mimeType = (file.mimetype || '').toLowerCase();
    if (!this.allowedChatFileExtensions.has(extension)) {
      throw new BadRequestException('当前仅支持 PDF、DOCX、XLSX、PNG、JPG、JPEG 文件');
    }
    if (mimeType.length > 0 && !this.allowedChatMimeTypes.has(mimeType)) {
      throw new BadRequestException('当前仅支持 PDF、DOCX、XLSX、PNG、JPG、JPEG 文件');
    }
  }

  saveChatFile(options: {
    file: Express.Multer.File;
    conversationId: string;
    messageId: string;
    conversationType: 'group' | 'direct';
  }) {
    this.assertAllowedChatFile(options.file);
    const channel = options.conversationType === 'group' ? 'groups' : 'direct';
    const folder = join(this.getUploadRoot(), 'chat', channel, options.conversationId, options.messageId);
    const extension = extname(this.sanitizeFileName(options.file.originalname || 'upload.bin')) || '.bin';
    const logicalPath = `/files/chat/${channel}/${options.conversationId}/${options.messageId}/original${extension}`;

    return this.writeStoredFile(folder, options.file, logicalPath);
  }

  removeChatMessageFile(sourcePath: string) {
    const normalizedPath = sourcePath.replace(/^\/files\//, '').replace(/\//g, '\\');
    const filePath = join(this.getUploadRoot(), normalizedPath);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  removeChatConversationFiles(conversationType: 'group' | 'direct', conversationId: string) {
    const channel = conversationType === 'group' ? 'groups' : 'direct';
    const folder = join(this.getUploadRoot(), 'chat', channel, conversationId);
    if (existsSync(folder)) {
      rmSync(folder, { recursive: true, force: true });
    }
  }
}
