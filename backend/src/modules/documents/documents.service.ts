import { Injectable } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

class ImportDocumentDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsIn(['public', 'private'])
  libraryType!: 'public' | 'private';

  @IsString()
  sourcePath!: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

type DocumentRecord = {
  id: string;
  title: string;
  libraryType: 'public' | 'private';
  sourcePath: string;
  chunkCount: number;
  indexStatus: 'ready' | 'processing' | 'queued';
  extractionMode: 'text' | 'ocr';
  uploadedAt: string;
  groupId: string | null;
};

type ExtractJobRecord = {
  id: string;
  documentId: string;
  status: 'processing' | 'queued' | 'completed';
  stage: 'extract' | 'ocr' | 'chunk' | 'index';
  progress: number;
  startedAt: string;
};

@Injectable()
export class DocumentsService {
  private readonly documents: DocumentRecord[] = [
    {
      id: 'doc-1',
      title: '某区财政专项资金管理办法',
      libraryType: 'public',
      sourcePath: '/policies/public/fiscal-rules.pdf',
      chunkCount: 18,
      indexStatus: 'ready',
      extractionMode: 'text',
      uploadedAt: '2026-04-25 10:00',
      groupId: null,
    },
    {
      id: 'doc-2',
      title: '某区财政局内部采购管理制度',
      libraryType: 'private',
      sourcePath: '/groups/group-1/purchase-guideline.docx',
      chunkCount: 12,
      indexStatus: 'ready',
      extractionMode: 'text',
      uploadedAt: '2026-04-25 14:00',
      groupId: 'group-1',
    },
    {
      id: 'doc-3',
      title: '某医院设备管理台账扫描件',
      libraryType: 'private',
      sourcePath: '/groups/group-1/equipment-scan.pdf',
      chunkCount: 0,
      indexStatus: 'processing',
      extractionMode: 'ocr',
      uploadedAt: '2026-04-25 15:30',
      groupId: 'group-1',
    },
  ];

  private readonly extractJobs: ExtractJobRecord[] = [
    {
      id: 'job-1',
      documentId: 'doc-3',
      status: 'processing',
      stage: 'ocr',
      progress: 45,
      startedAt: '2026-04-25 15:31',
    },
  ];

  listDocuments(groupId?: string) {
    return this.documents.filter((document) => {
      if (document.libraryType === 'public') {
        return true;
      }

      return groupId == null || document.groupId === groupId;
    });
  }

  listExtractionJobs() {
    return this.extractJobs;
  }

  importDocument(dto: ImportDocumentDto) {
    const lowerSourcePath = dto.sourcePath.toLowerCase();
    const isScan =
      lowerSourcePath.endsWith('.png') ||
      lowerSourcePath.endsWith('.jpg') ||
      lowerSourcePath.endsWith('.jpeg') ||
      lowerSourcePath.endsWith('.scan.pdf');

    return {
      id: 'doc-new',
      title: dto.title,
      libraryType: dto.libraryType,
      sourcePath: dto.sourcePath,
      groupId: dto.groupId ?? null,
      extractionMode: isScan ? 'ocr' : 'text',
      indexStatus: 'queued',
      chunkStrategy: 'structure-first',
      notes: '导入时抽取文字并建立索引，查询阶段不直接扫描原文件。',
    };
  }
}

export { ImportDocumentDto };
