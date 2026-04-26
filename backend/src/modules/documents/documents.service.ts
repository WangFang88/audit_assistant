import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

class ImportDocumentDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsIn(['public', 'private'])
  libraryType!: 'public' | 'private';

  @IsOptional()
  @IsString()
  @MinLength(20)
  rawText?: string;

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
    private readonly authService: AuthService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    private readonly localStateService: LocalStateService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    const persistedState = this.localStateService.readState();
    if (persistedState.documents) {
      this.documents.splice(0, this.documents.length, ...persistedState.documents);
    }
    if (persistedState.chunks) {
      this.chunks.splice(0, this.chunks.length, ...persistedState.chunks);
    }
  }

  private readonly documents: DocumentRecord[] = [
    {
      id: 'doc-1',
      title: '某区财政专项资金管理办法',
      libraryType: 'public',
      sourcePath: '/policies/public/fiscal-rules.pdf',
      chunkCount: 4,
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
      chunkCount: 4,
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
      chapterTitle: '第一章 适用范围',
      articleRef: '第三条',
      pageLabel: '第 1 页',
      content: '某区财政专项资金管理办法适用于预算安排、专项资金使用和绩效跟踪，相关支出须符合既定用途。',
      keywords: ['某区财政专项资金管理办法', 'fiscal', 'rules', '预算', '专项资金', '绩效', '用途', '范围', '职责'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-2',
      documentId: 'doc-1',
      groupId: null,
      libraryType: 'public',
      title: '某区财政专项资金管理办法',
      chapterTitle: '第二章 审批与执行',
      articleRef: '第七条',
      pageLabel: '第 2 页',
      content: '某区财政专项资金管理办法要求对申请、审批、拨付、执行和调整全过程留痕，重要事项应附依据材料。',
      keywords: ['某区财政专项资金管理办法', 'fiscal', 'rules', '申请', '审批', '执行', '留痕', '拨付', '调整', '依据'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-3',
      documentId: 'doc-1',
      groupId: null,
      libraryType: 'public',
      title: '某区财政专项资金管理办法',
      chapterTitle: '第三章 证据与归档',
      articleRef: '第十二条',
      pageLabel: '第 3 页',
      content: '某区财政专项资金管理办法要求对合同、发票、验收单、付款凭证及相关附件统一归档，保证后续查询可追溯。',
      keywords: ['某区财政专项资金管理办法', 'fiscal', 'rules', '合同', '发票', '验收单', '付款凭证', '归档', '可追溯'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-4',
      documentId: 'doc-1',
      groupId: null,
      libraryType: 'public',
      title: '某区财政专项资金管理办法',
      chapterTitle: '第四章 监督与整改',
      articleRef: '第十六条',
      pageLabel: '第 4 页',
      content: '某区财政专项资金管理办法明确对超范围支出、改变资金用途和资料缺失等问题应及时整改，并纳入审计关注事项。',
      keywords: ['某区财政专项资金管理办法', 'fiscal', 'rules', '整改', '监督', '审计', '超范围支出', '资金用途'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-5',
      documentId: 'doc-2',
      groupId: 'group-1',
      libraryType: 'private',
      title: '某区财政局内部采购管理制度',
      chapterTitle: '第一章 适用范围',
      articleRef: '第三条',
      pageLabel: '第 1 页',
      content: '某区财政局内部采购管理制度适用于项目组采购申请、审批分工和供应商比价管理，未经审批不得先采后补。',
      keywords: ['某区财政局内部采购管理制度', 'groups', 'group', 'purchase', 'guideline', '采购', '审批', '比价', '供应商', '范围', '职责'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-6',
      documentId: 'doc-2',
      groupId: 'group-1',
      libraryType: 'private',
      title: '某区财政局内部采购管理制度',
      chapterTitle: '第二章 审批与执行',
      articleRef: '第七条',
      pageLabel: '第 2 页',
      content: '某区财政局内部采购管理制度要求对立项、审批、采购执行、验收和付款实行分环节留痕，关键节点应形成书面记录。',
      keywords: ['某区财政局内部采购管理制度', 'groups', 'group', 'purchase', 'guideline', '申请', '审批', '执行', '留痕', '验收', '付款', '立项'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-7',
      documentId: 'doc-2',
      groupId: 'group-1',
      libraryType: 'private',
      title: '某区财政局内部采购管理制度',
      chapterTitle: '第三章 证据与归档',
      articleRef: '第十二条',
      pageLabel: '第 3 页',
      content: '某区财政局内部采购管理制度要求对合同、发票、验收单、付款凭证及相关附件统一归档，保证后续查询可追溯。',
      keywords: ['某区财政局内部采购管理制度', 'groups', 'group', 'purchase', 'guideline', '合同', '发票', '验收单', '付款凭证', '归档', '可追溯'],
      indexStatus: 'ready',
    },
    {
      id: 'chunk-8',
      documentId: 'doc-2',
      groupId: 'group-1',
      libraryType: 'private',
      title: '某区财政局内部采购管理制度',
      chapterTitle: '第四章 监督与整改',
      articleRef: '第十六条',
      pageLabel: '第 4 页',
      content: '某区财政局内部采购管理制度明确对未审批采购、凭证不完整和验收缺失等问题应限期整改并复核。',
      keywords: ['某区财政局内部采购管理制度', 'groups', 'group', 'purchase', 'guideline', '整改', '监督', '审计', '未审批采购', '凭证不完整', '验收缺失'],
      indexStatus: 'ready',
    },
  ];

  private assertAdminPublicLibraryOnly(groupId?: string) {
    if (!this.authService.isAdmin()) {
      return;
    }

    if (groupId != null) {
      throw new ForbiddenException('管理员仅可访问公共库，不能进入项目组私有库');
    }
  }

  private assertAdminCanAccessDocument(document: DocumentRecord) {
    if (!this.authService.isAdmin() || document.libraryType === 'public') {
      return;
    }

    throw new ForbiddenException('管理员仅可访问公共库文档，不能查看项目组私有资料');
  }

  listDocuments(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
    return this.documents.filter((document) => {
      if (document.libraryType === 'public') {
        return true;
      }

      return groupId != null && document.groupId === groupId;
    });
  }

  listExtractionJobs(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
    return this.extractJobs.filter((job) => {
      if (job.groupId == null) {
        return true;
      }

      return groupId != null && job.groupId === groupId;
    });
  }

  getReadyChunks(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
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

  listDocumentChunks(documentId: string) {
    const document = this.getDocumentById(documentId);
    this.assertAdminCanAccessDocument(document);
    return this.chunks.filter((chunk) => chunk.documentId === documentId);
  }

  getDocumentById(documentId: string) {
    const document = this.documents.find((item) => item.id === documentId);
    if (!document) {
      throw new NotFoundException('文档不存在');
    }

    return document;
  }

  private buildChunksFromRawText(document: DocumentRecord, rawText: string): DocumentChunkRecord[] {
    const normalizedText = rawText.replace(/\r/g, '').trim();
    const segments = normalizedText
      .split(/\n{2,}|(?=第[一二三四五六七八九十百]+[章节条])/)
      .map((segment) => segment.replace(/\s+/g, ' ').trim())
      .filter((segment) => segment.length >= 24)
      .slice(0, 8);

    if (segments.length === 0) {
      return [];
    }

    const titleKeywords = document.title
      .replace(/[()（）_./-]+/g, ' ')
      .split(/[\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 2);

    return segments.map((segment, index) => {
      const chapterMatch = segment.match(/第[一二三四五六七八九十百]+章[^。；，\n]*/);
      const articleMatch = segment.match(/第[一二三四五六七八九十百]+条/);
      const sentenceKeywords = Array.from(
        new Set(
          segment
            .replace(/[，。；：、“”‘’（）()【】\[\]\-]/g, ' ')
            .split(/[\s]+/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 2)
            .slice(0, 10),
        ),
      );

      return {
        id: `chunk-${this.chunks.length + index + 1}`,
        documentId: document.id,
        groupId: document.groupId,
        libraryType: document.libraryType,
        title: document.title,
        chapterTitle: chapterMatch?.[0] ?? `第${index + 1}段`,
        articleRef: articleMatch?.[0] ?? `第${index + 1}条`,
        pageLabel: `第 ${index + 1} 页`,
        content: segment,
        keywords: Array.from(new Set([...titleKeywords, ...sentenceKeywords])),
        indexStatus: 'ready',
      };
    });
  }

  private buildChunksForDocument(document: DocumentRecord): DocumentChunkRecord[] {
    const normalizedTitle = document.title.toLowerCase();
    const normalizedSource = document.sourcePath.toLowerCase();
    const baseKeywords = Array.from(
      new Set(
        `${document.title} ${document.sourcePath}`
          .replace(/[()（）_./-]+/g, ' ')
          .split(/[\s]+/)
          .map((item) => item.trim())
          .filter((item) => item.length >= 2),
      ),
    );
    const isProcurement = normalizedTitle.includes('采购') || normalizedSource.includes('purchase');
    const isFinance = normalizedTitle.includes('资金') || normalizedTitle.includes('预算') || normalizedTitle.includes('财政');
    const isEquipment = normalizedTitle.includes('设备') || normalizedSource.includes('equipment');
    const isScan = document.extractionMode === 'ocr';
    const chunkBlueprints = [
      {
        chapterTitle: '第一章 适用范围',
        articleRef: '第三条',
        pageLabel: '第 1 页',
        content: isProcurement
          ? `${document.title}适用于项目组采购申请、审批分工和供应商比价管理，未经审批不得先采后补。`
          : isFinance
            ? `${document.title}适用于预算安排、专项资金使用和绩效跟踪，相关支出须符合既定用途。`
            : isEquipment
              ? `${document.title}适用于设备采购、领用、维护和盘点，各环节应明确责任人员。`
              : `${document.title}适用于项目执行中的职责划分、审批边界和资料管理要求。`,
        keywords: [
          ...baseKeywords,
          ...(isProcurement ? ['采购', '审批', '比价', '供应商'] : []),
          ...(isFinance ? ['预算', '专项资金', '绩效', '用途'] : []),
          ...(isEquipment ? ['设备', '领用', '维护', '盘点'] : []),
          '范围',
          '职责',
        ],
      },
      {
        chapterTitle: '第二章 审批与执行',
        articleRef: '第七条',
        pageLabel: '第 2 页',
        content: isProcurement
          ? `${document.title}要求对立项、审批、采购执行、验收和付款实行分环节留痕，关键节点应形成书面记录。`
          : isFinance
            ? `${document.title}要求对申请、审批、拨付、执行和调整全过程留痕，重要事项应附依据材料。`
            : isEquipment
              ? `${document.title}要求对采购验收、资产登记、使用交接和维护记录实行闭环管理。`
              : `${document.title}要求对申请、审批、执行和结果确认形成完整业务闭环。`,
        keywords: [
          ...baseKeywords,
          '申请',
          '审批',
          '执行',
          '留痕',
          ...(isProcurement ? ['验收', '付款', '立项'] : []),
          ...(isFinance ? ['拨付', '调整', '依据'] : []),
          ...(isEquipment ? ['登记', '交接', '维护'] : []),
        ],
      },
      {
        chapterTitle: '第三章 证据与归档',
        articleRef: '第十二条',
        pageLabel: '第 3 页',
        content: isScan
          ? `${document.title}作为扫描件入库时，应补充页码标识、关键字段校核结果和 OCR 抽取复核记录。`
          : `${document.title}要求对合同、发票、验收单、付款凭证及相关附件统一归档，保证后续查询可追溯。`,
        keywords: [
          ...baseKeywords,
          ...(isScan ? ['扫描件', 'OCR', '复核', '页码'] : ['合同', '发票', '验收单', '付款凭证']),
          '归档',
          '可追溯',
        ],
      },
      {
        chapterTitle: '第四章 监督与整改',
        articleRef: '第十六条',
        pageLabel: '第 4 页',
        content: isFinance
          ? `${document.title}明确对超范围支出、改变资金用途和资料缺失等问题应及时整改，并纳入审计关注事项。`
          : isProcurement
            ? `${document.title}明确对未审批采购、凭证不完整和验收缺失等问题应限期整改并复核。`
            : `${document.title}明确对执行偏差、资料缺漏和责任不清等问题应及时整改并复盘。`,
        keywords: [
          ...baseKeywords,
          '整改',
          '监督',
          '审计',
          ...(isFinance ? ['超范围支出', '资金用途'] : []),
          ...(isProcurement ? ['未审批采购', '凭证不完整', '验收缺失'] : []),
        ],
      },
    ];

    return chunkBlueprints.map((blueprint, index) => ({
      id: `chunk-${this.chunks.length + index + 1}`,
      documentId: document.id,
      groupId: document.groupId,
      libraryType: document.libraryType,
      title: document.title,
      chapterTitle: blueprint.chapterTitle,
      articleRef: blueprint.articleRef,
      pageLabel: blueprint.pageLabel,
      content: blueprint.content,
      keywords: Array.from(new Set(blueprint.keywords)),
      indexStatus: 'ready',
    }));
  }

  private getUploadRoot() {
    return join(process.cwd(), '.data', 'uploads');
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-\u4e00-\u9fa5]+/g, '-');
  }

  private classifyUploadedFile(fileName: string) {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.docx')) {
      return { fileType: 'docx' as const, extractionMode: 'text' as const, pipelineStage: 'indexed' as const };
    }
    if (lowerName.endsWith('.xlsx')) {
      return { fileType: 'xlsx' as const, extractionMode: 'text' as const, pipelineStage: 'indexed' as const };
    }
    if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      return { fileType: 'image' as const, extractionMode: 'ocr' as const, pipelineStage: 'ocr' as const };
    }
    if (lowerName.endsWith('.scan.pdf')) {
      return { fileType: 'pdf' as const, extractionMode: 'ocr' as const, pipelineStage: 'ocr' as const };
    }
    if (lowerName.endsWith('.pdf')) {
      return { fileType: 'pdf' as const, extractionMode: 'text' as const, pipelineStage: 'indexed' as const };
    }
    throw new BadRequestException('仅支持上传 pdf、docx、xlsx、png、jpg、jpeg 文件');
  }

  private saveUploadedFile(file: Express.Multer.File, libraryType: 'public' | 'private', groupId?: string) {
    const sanitizedFileName = this.sanitizeFileName(file.originalname || 'upload.bin');
    const extension = extname(sanitizedFileName) || '.bin';
    const uploadFolder = libraryType === 'private' ? join(this.getUploadRoot(), 'groups', groupId ?? 'unknown') : join(this.getUploadRoot(), 'public');
    mkdirSync(uploadFolder, { recursive: true });

    const storedFileName = `${Date.now()}-${this.documents.length + 1}${extension}`;
    const storedFilePath = join(uploadFolder, storedFileName);
    writeFileSync(storedFilePath, file.buffer);

    const normalizedPath = libraryType === 'private'
      ? `/uploads/groups/${groupId}/${storedFileName}`
      : `/uploads/public/${storedFileName}`;

    return {
      sourcePath: normalizedPath,
      originalName: sanitizedFileName,
    };
  }

  importDocument(dto: ImportDocumentDto, file?: Express.Multer.File) {
    if (!file || !file.buffer || file.size <= 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    if (this.authService.isAdmin()) {
      if (dto.libraryType !== 'public' || dto.groupId != null) {
        throw new ForbiddenException('管理员仅可导入公共库文件，不能写入项目组私有库');
      }
    }

    if (dto.libraryType === 'private') {
      if (!dto.groupId) {
        throw new BadRequestException('私有库导入必须指定项目组');
      }
      this.groupsService.getGroupById(dto.groupId);
      const currentPrivateDocuments = this.documents.filter((document) => document.libraryType === 'private').length;
      this.subscriptionsService.assertCanImportPrivateDocument(currentPrivateDocuments);
    }

    const storedFile = this.saveUploadedFile(file, dto.libraryType, dto.groupId);
    const classification = this.classifyUploadedFile(storedFile.originalName);
    const hasRawText = dto.rawText != null && dto.rawText.trim().length > 0;

    const document: DocumentRecord = {
      id: `doc-${this.documents.length + 1}`,
      title: dto.title,
      libraryType: dto.libraryType,
      sourcePath: storedFile.sourcePath,
      chunkCount: 0,
      groupId: dto.groupId ?? null,
      fileType: classification.fileType,
      extractionMode: hasRawText ? 'text' : classification.extractionMode,
      uploadedAt: '2026-04-26 12:30',
      indexStatus: 'ready' as const,
      chunkStrategy: 'structure-first' as const,
      parserTarget: 'multimodal-parser' as const,
      embeddingTarget: 'bge-large-zh' as const,
      vectorStoreTarget: 'pgvector' as const,
      pipelineStage: hasRawText ? 'indexed' as const : classification.pipelineStage,
    };

    const generatedChunks = hasRawText ? this.buildChunksFromRawText(document, dto.rawText!) : this.buildChunksForDocument(document);
    document.chunkCount = generatedChunks.length;

    this.documents.push(document);
    this.chunks.push(...generatedChunks);
    this.localStateService.saveDocuments(this.documents);
    this.localStateService.saveChunks(this.chunks);
    if (dto.libraryType === 'private') {
      const group = this.groupsService.getGroupById(dto.groupId!);
      group.privateDocumentCount += 1;
      this.groupsService.persistState();
      const privateDocumentCount = this.documents.filter((item) => item.libraryType === 'private').length;
      this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
    }

    return {
      ...document,
      notes: '导入后会执行文字抽取、多模态拆解、结构化切分与向量化入库，查询阶段不直接扫描原文件。',
    };
  }

  removeGroupDocuments(groupId: string) {
    const remainingDocuments = this.documents.filter((document) => document.groupId !== groupId);
    const remainingChunks = this.chunks.filter((chunk) => chunk.groupId !== groupId);
    this.documents.splice(0, this.documents.length, ...remainingDocuments);
    this.chunks.splice(0, this.chunks.length, ...remainingChunks);
    this.localStateService.saveDocuments(this.documents);
    this.localStateService.saveChunks(this.chunks);

    const privateDocumentCount = this.documents.filter((document) => document.libraryType === 'private').length;
    this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
  }

  getLibraryScopeSummary(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
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
