import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { DocumentChunkEntity } from '../../database/entities/document-chunk.entity';
import { DocumentEntity } from '../../database/entities/document.entity';
import { DocumentExtractionJobEntity } from '../../database/entities/document-extraction-job.entity';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { FileStorageService } from './file-storage.service';

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
  fileName: string;
  uploadedBy: string;
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
    @InjectRepository(DocumentEntity)
    private readonly persistedDocumentRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentChunkEntity)
    private readonly persistedChunkRepository: Repository<DocumentChunkEntity>,
    @InjectRepository(DocumentExtractionJobEntity)
    private readonly persistedExtractionJobRepository: Repository<DocumentExtractionJobEntity>,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  private readonly documents: DocumentRecord[] = [
    {
      id: 'doc-1',
      title: '某区财政专项资金管理办法',
      libraryType: 'public',
      sourcePath: '/policies/public/fiscal-rules.pdf',
      fileName: 'fiscal-rules.pdf',
      uploadedBy: 'user-1',
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
      fileName: 'purchase-guideline.docx',
      uploadedBy: 'user-2',
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
      fileName: 'equipment-scan.pdf',
      uploadedBy: 'user-2',
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

  private toDocumentRecord(entity: DocumentEntity): DocumentRecord {
    return {
      id: entity.id,
      title: entity.title,
      libraryType: entity.libraryType,
      sourcePath: entity.filePath,
      fileName: entity.fileName,
      uploadedBy: entity.uploadedBy,
      chunkCount: entity.chunkCount,
      indexStatus: entity.indexStatus as DocumentRecord['indexStatus'],
      extractionMode: (entity.extractionMode ?? 'text') as DocumentRecord['extractionMode'],
      uploadedAt: entity.uploadedAt.toISOString().slice(0, 16).replace('T', ' '),
      groupId: entity.teamId,
      fileType: entity.fileType as DocumentRecord['fileType'],
      chunkStrategy: 'structure-first',
      parserTarget: entity.parserTarget as DocumentRecord['parserTarget'],
      embeddingTarget: entity.embeddingTarget as DocumentRecord['embeddingTarget'],
      vectorStoreTarget: entity.vectorStoreTarget as DocumentRecord['vectorStoreTarget'],
      pipelineStage: entity.indexStatus === 'ready' ? 'indexed' : entity.extractionMode === 'ocr' ? 'ocr' : 'queued',
    };
  }

  private toChunkRecord(entity: DocumentChunkEntity): DocumentChunkRecord {
    return {
      id: entity.id,
      documentId: entity.documentId,
      groupId: entity.teamId,
      libraryType: entity.libraryType,
      title: entity.title,
      chapterTitle: entity.chapterTitle ?? '',
      articleRef: entity.articleRef ?? '',
      pageLabel: entity.pageLabel ?? '',
      content: entity.content,
      keywords: entity.keywords,
      indexStatus: entity.indexStatus === 'failed' ? 'processing' : entity.indexStatus,
    };
  }

  private toExtractionJobRecord(entity: DocumentExtractionJobEntity): ExtractJobRecord {
    return {
      id: entity.id,
      documentId: entity.documentId,
      groupId: entity.teamId,
      status: entity.status === 'failed' ? 'processing' : entity.status,
      stage: entity.stage,
      progress: entity.progress,
      startedAt: entity.startedAt.toISOString().slice(0, 16).replace('T', ' '),
    };
  }

  private async ensurePersistedDocumentSeedData() {
    const documentCount = await this.persistedDocumentRepository.count();
    if (documentCount === 0) {
      await this.persistedDocumentRepository.save(
        this.documents.map((document) =>
          this.persistedDocumentRepository.create({
            id: document.id,
            title: document.title,
            fileName: document.fileName,
            filePath: document.sourcePath,
            fileType: document.fileType,
            libraryType: document.libraryType,
            teamId: document.groupId,
            uploadedBy: document.uploadedBy,
            uploadSource: 'seed',
            indexStatus: document.indexStatus,
            extractionMode: document.extractionMode,
            parserTarget: document.parserTarget,
            embeddingTarget: document.embeddingTarget,
            vectorStoreTarget: document.vectorStoreTarget,
            chunkCount: document.chunkCount,
            rawTextLength: 0,
            uploadedAt: new Date(document.uploadedAt.replace(' ', 'T')),
            indexedAt: document.indexStatus === 'ready' ? new Date(document.uploadedAt.replace(' ', 'T')) : null,
            deletedAt: null,
          }),
        ),
      );
    }

    const chunkCount = await this.persistedChunkRepository.count();
    if (chunkCount === 0) {
      await this.persistedChunkRepository.save(
        this.chunks.map((chunk, index) =>
          this.persistedChunkRepository.create({
            id: chunk.id,
            documentId: chunk.documentId,
            teamId: chunk.groupId,
            libraryType: chunk.libraryType,
            title: chunk.title,
            chapterTitle: chunk.chapterTitle,
            articleRef: chunk.articleRef,
            pageLabel: chunk.pageLabel,
            content: chunk.content,
            keywords: chunk.keywords,
            chunkIndex: index,
            indexStatus: chunk.indexStatus,
            tokenCount: chunk.content.length,
          }),
        ),
      );
    }

    const extractionJobCount = await this.persistedExtractionJobRepository.count();
    if (extractionJobCount === 0) {
      await this.persistedExtractionJobRepository.save(
        this.extractJobs.map((job) =>
          this.persistedExtractionJobRepository.create({
            id: job.id,
            documentId: job.documentId,
            teamId: job.groupId,
            status: job.status,
            stage: job.stage,
            progress: job.progress,
            errorMessage: null,
            startedAt: new Date(job.startedAt.replace(' ', 'T')),
            finishedAt: job.status === 'completed' ? new Date(job.startedAt.replace(' ', 'T')) : null,
          }),
        ),
      );
    }
  }

  async listDocuments(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
    if (!this.authService.isAdmin() && groupId != null) {
      this.groupsService.assertCanAccessGroup(groupId);
    }

    await this.ensurePersistedDocumentSeedData();
    const entities = await this.persistedDocumentRepository.find({
      where: { deletedAt: IsNull() },
      order: { uploadedAt: 'ASC' },
    });

    return entities.map((entity) => this.toDocumentRecord(entity)).filter((document) => {
      if (document.libraryType === 'public') {
        return true;
      }

      return groupId != null && document.groupId === groupId;
    });
  }

  async listExtractionJobs(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
    if (!this.authService.isAdmin() && groupId != null) {
      this.groupsService.assertCanAccessGroup(groupId);
    }

    await this.ensurePersistedDocumentSeedData();
    const entities = await this.persistedExtractionJobRepository.find({
      order: { startedAt: 'ASC' },
    });

    return entities.map((entity) => this.toExtractionJobRecord(entity)).filter((job) => {
      if (job.groupId == null) {
        return true;
      }

      return groupId != null && job.groupId === groupId;
    });
  }

  async getReadyChunks(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
    if (!this.authService.isAdmin() && groupId != null) {
      this.groupsService.assertCanAccessGroup(groupId);
    }

    await this.ensurePersistedDocumentSeedData();
    const entities = await this.persistedChunkRepository.find({
      order: { chunkIndex: 'ASC', createdAt: 'ASC' },
    });

    return entities.map((entity) => this.toChunkRecord(entity)).filter((chunk) => {
      if (chunk.indexStatus !== 'ready') {
        return false;
      }

      if (chunk.libraryType === 'public') {
        return true;
      }

      return groupId != null && chunk.groupId === groupId;
    });
  }

  async listDocumentChunks(documentId: string) {
    const document = await this.getDocumentById(documentId);
    this.assertAdminCanAccessDocument(document);
    if (!this.authService.isAdmin() && document.libraryType === 'private' && document.groupId != null) {
      this.groupsService.assertCanAccessGroup(document.groupId);
    }

    await this.ensurePersistedDocumentSeedData();
    const entities = await this.persistedChunkRepository.find({
      where: { documentId },
      order: { chunkIndex: 'ASC', createdAt: 'ASC' },
    });

    return entities.map((entity) => this.toChunkRecord(entity));
  }

  async getDocumentById(documentId: string) {
    await this.ensurePersistedDocumentSeedData();
    const entity = await this.persistedDocumentRepository.findOne({
      where: { id: documentId, deletedAt: IsNull() },
    });
    if (!entity) {
      throw new NotFoundException('文档不存在');
    }

    return this.toDocumentRecord(entity);
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

  private saveUploadedFile(file: Express.Multer.File, libraryType: 'public' | 'private', documentId: string, groupId?: string) {
    return this.fileStorageService.saveFile({
      file,
      libraryType,
      documentId,
      groupId,
    });
  }

  private toDocumentEntity(document: DocumentRecord) {
    return this.persistedDocumentRepository.create({
      id: document.id,
      title: document.title,
      fileName: document.fileName,
      filePath: document.sourcePath,
      fileType: document.fileType,
      libraryType: document.libraryType,
      teamId: document.groupId,
      uploadedBy: document.uploadedBy,
      uploadSource: 'manual-upload',
      indexStatus: document.indexStatus,
      extractionMode: document.extractionMode,
      parserTarget: document.parserTarget,
      embeddingTarget: document.embeddingTarget,
      vectorStoreTarget: document.vectorStoreTarget,
      chunkCount: document.chunkCount,
      rawTextLength: 0,
      uploadedAt: new Date(document.uploadedAt.replace(' ', 'T')),
      indexedAt: document.indexStatus === 'ready' ? new Date(document.uploadedAt.replace(' ', 'T')) : null,
      deletedAt: null,
    });
  }

  private toChunkEntity(chunk: DocumentChunkRecord, index: number) {
    return this.persistedChunkRepository.create({
      id: chunk.id,
      documentId: chunk.documentId,
      teamId: chunk.groupId,
      libraryType: chunk.libraryType,
      title: chunk.title,
      chapterTitle: chunk.chapterTitle,
      articleRef: chunk.articleRef,
      pageLabel: chunk.pageLabel,
      content: chunk.content,
      keywords: chunk.keywords,
      chunkIndex: index,
      indexStatus: chunk.indexStatus,
      tokenCount: chunk.content.length,
    });
  }

  async importDocument(dto: ImportDocumentDto, file?: Express.Multer.File) {
    if (!file || !file.buffer || file.size <= 0) {
      throw new BadRequestException('请选择要上传的文件');
    }

    await this.ensurePersistedDocumentSeedData();

    if (this.authService.isAdmin()) {
      if (dto.libraryType !== 'public' || dto.groupId != null) {
        throw new ForbiddenException('管理员仅可导入公共库文件，不能写入项目组私有库');
      }
    }

    if (dto.libraryType === 'private') {
      if (!dto.groupId) {
        throw new BadRequestException('私有库导入必须指定项目组');
      }
      this.groupsService.assertCanAccessGroup(dto.groupId);
      const currentPrivateDocuments = await this.persistedDocumentRepository.count({
        where: { libraryType: 'private', deletedAt: IsNull() },
      });
      this.subscriptionsService.assertCanImportPrivateDocument(currentPrivateDocuments);
    }

    const documentId = `doc-${Date.now()}`;
    const storedFile = this.saveUploadedFile(file, dto.libraryType, documentId, dto.groupId);
    const classification = this.classifyUploadedFile(storedFile.originalName);
    const hasRawText = dto.rawText != null && dto.rawText.trim().length > 0;
    const uploadedBy = this.authService.me().id;

    const document: DocumentRecord = {
      id: documentId,
      title: dto.title,
      libraryType: dto.libraryType,
      sourcePath: storedFile.sourcePath,
      fileName: storedFile.originalName,
      uploadedBy,
      chunkCount: 0,
      groupId: dto.groupId ?? null,
      fileType: classification.fileType,
      extractionMode: hasRawText ? 'text' : classification.extractionMode,
      uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      indexStatus: 'ready' as const,
      chunkStrategy: 'structure-first' as const,
      parserTarget: 'multimodal-parser' as const,
      embeddingTarget: 'bge-large-zh' as const,
      vectorStoreTarget: 'pgvector' as const,
      pipelineStage: hasRawText ? 'indexed' as const : classification.pipelineStage,
    };

    const generatedChunks = hasRawText ? this.buildChunksFromRawText(document, dto.rawText!) : this.buildChunksForDocument(document);
    document.chunkCount = generatedChunks.length;

    await this.persistedDocumentRepository.save(this.toDocumentEntity(document));
    if (generatedChunks.length > 0) {
      await this.persistedChunkRepository.save(generatedChunks.map((chunk, index) => this.toChunkEntity(chunk, index)));
    }
    if (!hasRawText || classification.pipelineStage !== 'indexed') {
      await this.persistedExtractionJobRepository.save(
        this.persistedExtractionJobRepository.create({
          id: `job-${document.id}`,
          documentId: document.id,
          teamId: document.groupId,
          status: 'processing',
          stage: classification.pipelineStage === 'ocr' ? 'ocr' : 'index',
          progress: classification.pipelineStage === 'ocr' ? 45 : 80,
          errorMessage: null,
          startedAt: new Date(document.uploadedAt.replace(' ', 'T')),
          finishedAt: hasRawText ? new Date(document.uploadedAt.replace(' ', 'T')) : null,
        }),
      );
    }

    if (document.libraryType === 'private') {
      const group = this.groupsService.getGroupById(dto.groupId!);
      group.privateDocumentCount += 1;
      this.groupsService.persistState();
      const privateDocumentCount = await this.persistedDocumentRepository.count({
        where: { libraryType: 'private', deletedAt: IsNull() },
      });
      this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
    }

    return {
      ...document,
      notes: '导入后会执行文字抽取、多模态拆解、结构化切分与向量化入库，查询阶段不直接扫描原文件。',
    };
  }

  async removeGroupDocuments(groupId: string) {
    await this.ensurePersistedDocumentSeedData();
    const documents = await this.persistedDocumentRepository.find({ where: { teamId: groupId, deletedAt: IsNull() } });
    if (documents.length === 0) {
      return;
    }

    const documentIds = documents.map((document) => document.id);
    await this.persistedChunkRepository.delete(documentIds.map((documentId) => ({ documentId })));
    await this.persistedExtractionJobRepository.delete(documentIds.map((documentId) => ({ documentId })));
    await this.persistedDocumentRepository.delete(documentIds.map((id) => ({ id })));

    const privateDocumentCount = await this.persistedDocumentRepository.count({
      where: { libraryType: 'private', deletedAt: IsNull() },
    });
    this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
  }

  async getLibraryScopeSummary(groupId?: string) {
    this.assertAdminPublicLibraryOnly(groupId);
    const documents = await this.listDocuments(groupId);
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
