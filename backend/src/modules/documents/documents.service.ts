import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
  fileType: 'pdf' | 'docx' | 'xlsx' | 'image';
  chunkStrategy: 'structure-first' | 'length-fallback';
  parserTarget: 'multimodal-parser';
  embeddingTarget: 'bge-large-zh';
  vectorStoreTarget: 'pgvector';
  pipelineStage: 'indexed' | 'extracting' | 'ocr' | 'chunking' | 'vectorizing' | 'queued';
};

type ExtractJobRecord = {
  id: string;
  documentId: string;
  groupId: string | null;
  status: 'processing' | 'queued' | 'completed';
  stage: 'extract' | 'ocr' | 'chunk' | 'index';
  progress: number;
  startedAt: string;
};

type DocumentChunkRecord = {
  id: string;
  documentId: string;
  groupId: string | null;
  libraryType: 'public' | 'private';
  title: string;
  chapterTitle: string;
  articleRef: string;
  pageLabel: string;
  content: string;
  keywords: string[];
  indexStatus: 'ready' | 'processing';
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

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
      fileType: 'pdf',
      chunkStrategy: 'structure-first',
      parserTarget: 'multimodal-parser',
      embeddingTarget: 'bge-large-zh',
      vectorStoreTarget: 'pgvector',
      pipelineStage: 'indexed',
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
      fileType: 'docx',
      chunkStrategy: 'structure-first',
      parserTarget: 'multimodal-parser',
      embeddingTarget: 'bge-large-zh',
      vectorStoreTarget: 'pgvector',
      pipelineStage: 'indexed',
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
      fileType: 'pdf',
      chunkStrategy: 'length-fallback',
      parserTarget: 'multimodal-parser',
      embeddingTarget: 'bge-large-zh',
      vectorStoreTarget: 'pgvector',
      pipelineStage: 'ocr',
    },
  ];

  private readonly extractJobs: ExtractJobRecord[] = [
    {
      id: 'job-1',
      documentId: 'doc-3',
      groupId: 'group-1',
      status: 'processing',
      stage: 'ocr',
      progress: 45,
      startedAt: '2026-04-25 15:31',
    },
  ];

  private readonly chunks: DocumentChunkRecord[] = [
    {
      id: 'chunk-1',
      documentId: 'doc-1',
      groupId: null,
      libraryType: 'public',
      title: '某区财政专项资金管理办法',
      chapterTitle: '第二章 资金使用',
      articleRef: '第十二条',
      pageLabel: '第 6 页',
      content: '专项资金使用应符合预算用途，不得擅自改变资金性质。',
      keywords: ['专项资金', '预算', '用途'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-2',
      documentId: 'doc-1',
      groupId: null,
      libraryType: 'public',
      title: '某区财政专项资金管理办法',
      chapterTitle: '第二章 资金使用',
      articleRef: '第十五条',
      pageLabel: '第 8 页',
      content: '专项资金支出应专款专用，并留存完整依据。',
      keywords: ['专项资金', '支出', '依据'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-3',
      documentId: 'doc-2',
      groupId: 'group-1',
      libraryType: 'private',
      title: '某区财政局内部采购管理制度',
      chapterTitle: '第一章 总则',
      articleRef: '第四条',
      pageLabel: '第 2 页',
      content: '项目组内部采购须履行审批、比价、验收与留痕。',
      keywords: ['采购', '审批', '比价', '验收'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-4',
      documentId: 'doc-2',
      groupId: 'group-1',
      libraryType: 'private',
      title: '某区财政局内部采购管理制度',
      chapterTitle: '第二章 执行要求',
      articleRef: '第九条',
      pageLabel: '第 5 页',
      content: '采购执行过程应保留审批单、合同、验收记录和付款凭证。',
      keywords: ['采购', '合同', '验收', '付款'],
      indexStatus: 'ready',
    },
  ];

  listDocuments(groupId?: string) {
    return this.documents.filter((document) => {
      if (document.libraryType === 'public') {
        return true;
      }

      return groupId != null && document.groupId === groupId;
    });
  }

  listExtractionJobs(groupId?: string) {
    return this.extractJobs.filter((job) => {
      if (job.groupId == null) {
        return true;
      }

      return groupId != null && job.groupId === groupId;
    });
  }

  getReadyChunks(groupId?: string) {
    return this.chunks.filter((chunk) => {
      if (chunk.indexStatus !== 'ready') {
        return false;
      }

      if (chunk.libraryType === 'public') {
        return true;
      }

      return groupId != null && chunk.groupId === groupId;
    });
  }

  getDocumentById(documentId: string) {
    const document = this.documents.find((item) => item.id === documentId);
    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    return document;
  }

  importDocument(dto: ImportDocumentDto) {
    if (dto.libraryType === 'private') {
      if (!dto.groupId) {
        throw new BadRequestException('私有库导入必须指定项目组');
      }
      this.groupsService.getGroupById(dto.groupId);
      const currentPrivateDocuments = this.documents.filter((document) => document.libraryType === 'private').length;
      this.subscriptionsService.assertCanImportPrivateDocument(currentPrivateDocuments);
    }

    const lowerSourcePath = dto.sourcePath.toLowerCase();
    const isScan =
      lowerSourcePath.endsWith('.png') ||
      lowerSourcePath.endsWith('.jpg') ||
      lowerSourcePath.endsWith('.jpeg') ||
      lowerSourcePath.endsWith('.scan.pdf');

    const fileType: DocumentRecord['fileType'] = lowerSourcePath.endsWith('.docx')
      ? 'docx'
      : lowerSourcePath.endsWith('.xlsx')
        ? 'xlsx'
        : lowerSourcePath.endsWith('.png') ||
            lowerSourcePath.endsWith('.jpg') ||
            lowerSourcePath.endsWith('.jpeg')
          ? 'image'
          : 'pdf';

    const document: DocumentRecord = {
      id: `doc-${this.documents.length + 1}`,
      title: dto.title,
      libraryType: dto.libraryType,
      sourcePath: dto.sourcePath,
      chunkCount: 0,
      groupId: dto.groupId ?? null,
      fileType,
      extractionMode: isScan ? 'ocr' : 'text',
      uploadedAt: '2026-04-26 12:30',
      indexStatus: 'queued' as const,
      chunkStrategy: 'structure-first' as const,
      parserTarget: 'multimodal-parser' as const,
      embeddingTarget: 'bge-large-zh' as const,
      vectorStoreTarget: 'pgvector' as const,
      pipelineStage: 'queued' as const,
    };

    this.documents.push(document);
    if (dto.libraryType === 'private') {
      const group = this.groupsService.getGroupById(dto.groupId!);
      group.privateDocumentCount += 1;
      const privateDocumentCount = this.documents.filter((item) => item.libraryType === 'private').length;
      this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
    }

    return {
      ...document,
      notes: '导入后会执行文字抽取、多模态拆解、结构化切分与向量化入库，查询阶段不直接扫描原文件。',
    };
  }

  getLibraryScopeSummary(groupId?: string) {
    const documents = this.listDocuments(groupId);
    const publicDocuments = documents.filter((document) => document.libraryType === 'public').length;
    const privateDocuments = documents.filter((document) => document.libraryType === 'private').length;
    const scopeMode = groupId == null ? 'public_only' : 'public_plus_current_group_private';

    return {
      scopeMode,
      includesPublicLibrary: true,
      includesPrivateLibrary: groupId != null,
      publicDocumentCount: publicDocuments,
      privateDocumentCount: privateDocuments,
    };
  }
}

export { ImportDocumentDto };
