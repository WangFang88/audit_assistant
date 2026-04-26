import { Injectable } from '@nestjs/common';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

@Injectable()
export class FileStorageService {
  private getUploadRoot() {
    return join(process.cwd(), '.data', 'uploads');
  }

  sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-\u4e00-\u9fa5]+/g, '-');
  }

  saveFile(options: {
    file: Express.Multer.File;
    libraryType: 'public' | 'private';
    documentId: string;
    groupId?: string;
  }) {
    const sanitizedFileName = this.sanitizeFileName(options.file.originalname || 'upload.bin');
    const extension = extname(sanitizedFileName) || '.bin';
    const folder = options.libraryType === 'private'
      ? join(this.getUploadRoot(), 'teams', options.groupId ?? 'unknown', options.documentId)
      : join(this.getUploadRoot(), 'public', options.documentId);
    mkdirSync(folder, { recursive: true });

    const storedFileName = `original${extension}`;
    const storedFilePath = join(folder, storedFileName);
    writeFileSync(storedFilePath, options.file.buffer);

    const logicalPath = options.libraryType === 'private'
      ? `/files/teams/${options.groupId}/${options.documentId}/${storedFileName}`
      : `/files/public/${options.documentId}/${storedFileName}`;

    return {
      sourcePath: logicalPath,
      originalName: sanitizedFileName,
    };
  }
}
