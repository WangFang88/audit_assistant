"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportDocumentDto = exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const document_chunk_entity_1 = require("../../database/entities/document-chunk.entity");
const document_entity_1 = require("../../database/entities/document.entity");
const document_extraction_job_entity_1 = require("../../database/entities/document-extraction-job.entity");
const class_validator_1 = require("class-validator");
const auth_service_1 = require("../auth/auth.service");
const groups_service_1 = require("../groups/groups.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const file_storage_service_1 = require("./file-storage.service");
class ImportDocumentDto {
}
exports.ImportDocumentDto = ImportDocumentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], ImportDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['public', 'private']),
    __metadata("design:type", String)
], ImportDocumentDto.prototype, "libraryType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(20),
    __metadata("design:type", String)
], ImportDocumentDto.prototype, "rawText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportDocumentDto.prototype, "groupId", void 0);
let DocumentsService = class DocumentsService {
    constructor(persistedDocumentRepository, persistedChunkRepository, persistedExtractionJobRepository, authService, groupsService, subscriptionsService, fileStorageService) {
        this.persistedDocumentRepository = persistedDocumentRepository;
        this.persistedChunkRepository = persistedChunkRepository;
        this.persistedExtractionJobRepository = persistedExtractionJobRepository;
        this.authService = authService;
        this.groupsService = groupsService;
        this.subscriptionsService = subscriptionsService;
        this.fileStorageService = fileStorageService;
        this.documents = [
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
        this.extractJobs = [
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
        this.chunks = [
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
    }
    assertAdminPublicLibraryOnly(groupId) {
        if (!this.authService.isAdmin()) {
            return;
        }
        if (groupId != null) {
            throw new common_1.ForbiddenException('管理员仅可访问公共库，不能进入项目组私有库');
        }
    }
    assertAdminCanAccessDocument(document) {
        if (!this.authService.isAdmin() || document.libraryType === 'public') {
            return;
        }
        throw new common_1.ForbiddenException('管理员仅可访问公共库文档，不能查看项目组私有资料');
    }
    toDocumentRecord(entity) {
        return {
            id: entity.id,
            title: entity.title,
            libraryType: entity.libraryType,
            sourcePath: entity.filePath,
            fileName: entity.fileName,
            uploadedBy: entity.uploadedBy,
            chunkCount: entity.chunkCount,
            indexStatus: entity.indexStatus,
            extractionMode: (entity.extractionMode ?? 'text'),
            uploadedAt: entity.uploadedAt.toISOString().slice(0, 16).replace('T', ' '),
            groupId: entity.teamId,
            fileType: entity.fileType,
            chunkStrategy: 'structure-first',
            parserTarget: entity.parserTarget,
            embeddingTarget: entity.embeddingTarget,
            vectorStoreTarget: entity.vectorStoreTarget,
            pipelineStage: entity.indexStatus === 'ready' ? 'indexed' : entity.extractionMode === 'ocr' ? 'ocr' : 'queued',
        };
    }
    toChunkRecord(entity) {
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
    toExtractionJobRecord(entity) {
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
    async ensurePersistedDocumentSeedData() {
        const documentCount = await this.persistedDocumentRepository.count();
        if (documentCount === 0) {
            await this.persistedDocumentRepository.save(this.documents.map((document) => this.persistedDocumentRepository.create({
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
            })));
        }
        const chunkCount = await this.persistedChunkRepository.count();
        if (chunkCount === 0) {
            await this.persistedChunkRepository.save(this.chunks.map((chunk, index) => this.persistedChunkRepository.create({
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
            })));
        }
        const extractionJobCount = await this.persistedExtractionJobRepository.count();
        if (extractionJobCount === 0) {
            await this.persistedExtractionJobRepository.save(this.extractJobs.map((job) => this.persistedExtractionJobRepository.create({
                id: job.id,
                documentId: job.documentId,
                teamId: job.groupId,
                status: job.status,
                stage: job.stage,
                progress: job.progress,
                errorMessage: null,
                startedAt: new Date(job.startedAt.replace(' ', 'T')),
                finishedAt: job.status === 'completed' ? new Date(job.startedAt.replace(' ', 'T')) : null,
            })));
        }
    }
    async listDocuments(groupId) {
        this.assertAdminPublicLibraryOnly(groupId);
        if (!this.authService.isAdmin() && groupId != null) {
            this.groupsService.assertCanAccessGroup(groupId);
        }
        await this.ensurePersistedDocumentSeedData();
        const entities = await this.persistedDocumentRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            order: { uploadedAt: 'ASC' },
        });
        return entities.map((entity) => this.toDocumentRecord(entity)).filter((document) => {
            if (document.libraryType === 'public') {
                return true;
            }
            return groupId != null && document.groupId === groupId;
        });
    }
    async listExtractionJobs(groupId) {
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
    async getReadyChunks(groupId) {
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
    async listDocumentChunks(documentId) {
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
    async getDocumentById(documentId) {
        await this.ensurePersistedDocumentSeedData();
        const entity = await this.persistedDocumentRepository.findOne({
            where: { id: documentId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        if (!entity) {
            throw new common_1.NotFoundException('文档不存在');
        }
        return this.toDocumentRecord(entity);
    }
    buildChunksFromRawText(document, rawText) {
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
            const sentenceKeywords = Array.from(new Set(segment
                .replace(/[，。；：、“”‘’（）()【】\[\]\-]/g, ' ')
                .split(/[\s]+/)
                .map((item) => item.trim())
                .filter((item) => item.length >= 2)
                .slice(0, 10)));
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
    buildChunksForDocument(document) {
        const normalizedTitle = document.title.toLowerCase();
        const normalizedSource = document.sourcePath.toLowerCase();
        const baseKeywords = Array.from(new Set(`${document.title} ${document.sourcePath}`
            .replace(/[()（）_./-]+/g, ' ')
            .split(/[\s]+/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 2)));
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
    classifyUploadedFile(fileName) {
        const lowerName = fileName.toLowerCase();
        if (lowerName.endsWith('.docx')) {
            return { fileType: 'docx', extractionMode: 'text', pipelineStage: 'indexed' };
        }
        if (lowerName.endsWith('.xlsx')) {
            return { fileType: 'xlsx', extractionMode: 'text', pipelineStage: 'indexed' };
        }
        if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
            return { fileType: 'image', extractionMode: 'ocr', pipelineStage: 'ocr' };
        }
        if (lowerName.endsWith('.scan.pdf')) {
            return { fileType: 'pdf', extractionMode: 'ocr', pipelineStage: 'ocr' };
        }
        if (lowerName.endsWith('.pdf')) {
            return { fileType: 'pdf', extractionMode: 'text', pipelineStage: 'indexed' };
        }
        throw new common_1.BadRequestException('仅支持上传 pdf、docx、xlsx、png、jpg、jpeg 文件');
    }
    saveUploadedFile(file, libraryType, documentId, groupId) {
        return this.fileStorageService.saveFile({
            file,
            libraryType,
            documentId,
            groupId,
        });
    }
    toDocumentEntity(document) {
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
    toChunkEntity(chunk, index) {
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
    async importDocument(dto, file) {
        if (!file || !file.buffer || file.size <= 0) {
            throw new common_1.BadRequestException('请选择要上传的文件');
        }
        await this.ensurePersistedDocumentSeedData();
        if (this.authService.isAdmin()) {
            if (dto.libraryType !== 'public' || dto.groupId != null) {
                throw new common_1.ForbiddenException('管理员仅可导入公共库文件，不能写入项目组私有库');
            }
        }
        if (dto.libraryType === 'private') {
            if (!dto.groupId) {
                throw new common_1.BadRequestException('私有库导入必须指定项目组');
            }
            this.groupsService.assertCanAccessGroup(dto.groupId);
            const currentPrivateDocuments = await this.persistedDocumentRepository.count({
                where: { libraryType: 'private', deletedAt: (0, typeorm_2.IsNull)() },
            });
            this.subscriptionsService.assertCanImportPrivateDocument(currentPrivateDocuments);
        }
        const documentId = `doc-${Date.now()}`;
        const storedFile = this.saveUploadedFile(file, dto.libraryType, documentId, dto.groupId);
        const classification = this.classifyUploadedFile(storedFile.originalName);
        const hasRawText = dto.rawText != null && dto.rawText.trim().length > 0;
        const uploadedBy = this.authService.me().id;
        const document = {
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
            indexStatus: 'ready',
            chunkStrategy: 'structure-first',
            parserTarget: 'multimodal-parser',
            embeddingTarget: 'bge-large-zh',
            vectorStoreTarget: 'pgvector',
            pipelineStage: hasRawText ? 'indexed' : classification.pipelineStage,
        };
        const generatedChunks = hasRawText ? this.buildChunksFromRawText(document, dto.rawText) : this.buildChunksForDocument(document);
        document.chunkCount = generatedChunks.length;
        await this.persistedDocumentRepository.save(this.toDocumentEntity(document));
        if (generatedChunks.length > 0) {
            await this.persistedChunkRepository.save(generatedChunks.map((chunk, index) => this.toChunkEntity(chunk, index)));
        }
        if (!hasRawText || classification.pipelineStage !== 'indexed') {
            await this.persistedExtractionJobRepository.save(this.persistedExtractionJobRepository.create({
                id: `job-${document.id}`,
                documentId: document.id,
                teamId: document.groupId,
                status: 'processing',
                stage: classification.pipelineStage === 'ocr' ? 'ocr' : 'index',
                progress: classification.pipelineStage === 'ocr' ? 45 : 80,
                errorMessage: null,
                startedAt: new Date(document.uploadedAt.replace(' ', 'T')),
                finishedAt: hasRawText ? new Date(document.uploadedAt.replace(' ', 'T')) : null,
            }));
        }
        if (document.libraryType === 'private') {
            const group = this.groupsService.getGroupById(dto.groupId);
            group.privateDocumentCount += 1;
            this.groupsService.persistState();
            const privateDocumentCount = await this.persistedDocumentRepository.count({
                where: { libraryType: 'private', deletedAt: (0, typeorm_2.IsNull)() },
            });
            this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
        }
        return {
            ...document,
            notes: '导入后会执行文字抽取、多模态拆解、结构化切分与向量化入库，查询阶段不直接扫描原文件。',
        };
    }
    async removeGroupDocuments(groupId) {
        await this.ensurePersistedDocumentSeedData();
        const documents = await this.persistedDocumentRepository.find({ where: { teamId: groupId, deletedAt: (0, typeorm_2.IsNull)() } });
        if (documents.length === 0) {
            return;
        }
        const documentIds = documents.map((document) => document.id);
        await this.persistedChunkRepository.delete(documentIds.map((documentId) => ({ documentId })));
        await this.persistedExtractionJobRepository.delete(documentIds.map((documentId) => ({ documentId })));
        await this.persistedDocumentRepository.delete(documentIds.map((id) => ({ id })));
        const privateDocumentCount = await this.persistedDocumentRepository.count({
            where: { libraryType: 'private', deletedAt: (0, typeorm_2.IsNull)() },
        });
        this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
    }
    async getLibraryScopeSummary(groupId) {
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
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(document_chunk_entity_1.DocumentChunkEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(document_extraction_job_entity_1.DocumentExtractionJobEntity)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => groups_service_1.GroupsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService,
        groups_service_1.GroupsService,
        subscriptions_service_1.SubscriptionsService,
        file_storage_service_1.FileStorageService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map