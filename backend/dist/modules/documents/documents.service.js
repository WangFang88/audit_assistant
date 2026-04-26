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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportDocumentDto = exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const groups_service_1 = require("../groups/groups.service");
const local_state_service_1 = require("../subscriptions/local-state.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
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
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportDocumentDto.prototype, "sourcePath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportDocumentDto.prototype, "groupId", void 0);
let DocumentsService = class DocumentsService {
    constructor(groupsService, localStateService, subscriptionsService) {
        this.groupsService = groupsService;
        this.localStateService = localStateService;
        this.subscriptionsService = subscriptionsService;
        this.documents = [
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
        const persistedState = this.localStateService.readState();
        if (persistedState.documents) {
            this.documents.splice(0, this.documents.length, ...persistedState.documents);
        }
        if (persistedState.chunks) {
            this.chunks.splice(0, this.chunks.length, ...persistedState.chunks);
        }
    }
    listDocuments(groupId) {
        return this.documents.filter((document) => {
            if (document.libraryType === 'public') {
                return true;
            }
            return groupId != null && document.groupId === groupId;
        });
    }
    listExtractionJobs(groupId) {
        return this.extractJobs.filter((job) => {
            if (job.groupId == null) {
                return true;
            }
            return groupId != null && job.groupId === groupId;
        });
    }
    getReadyChunks(groupId) {
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
    getDocumentById(documentId) {
        const document = this.documents.find((item) => item.id === documentId);
        if (!document) {
            throw new common_1.NotFoundException('文档不存在');
        }
        return document;
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
    importDocument(dto) {
        if (dto.libraryType === 'private') {
            if (!dto.groupId) {
                throw new common_1.BadRequestException('私有库导入必须指定项目组');
            }
            this.groupsService.getGroupById(dto.groupId);
            const currentPrivateDocuments = this.documents.filter((document) => document.libraryType === 'private').length;
            this.subscriptionsService.assertCanImportPrivateDocument(currentPrivateDocuments);
        }
        const lowerSourcePath = dto.sourcePath.toLowerCase();
        const isScan = lowerSourcePath.endsWith('.png') ||
            lowerSourcePath.endsWith('.jpg') ||
            lowerSourcePath.endsWith('.jpeg') ||
            lowerSourcePath.endsWith('.scan.pdf');
        const fileType = lowerSourcePath.endsWith('.docx')
            ? 'docx'
            : lowerSourcePath.endsWith('.xlsx')
                ? 'xlsx'
                : lowerSourcePath.endsWith('.png') ||
                    lowerSourcePath.endsWith('.jpg') ||
                    lowerSourcePath.endsWith('.jpeg')
                    ? 'image'
                    : 'pdf';
        const generatedChunkCount = 2;
        const document = {
            id: `doc-${this.documents.length + 1}`,
            title: dto.title,
            libraryType: dto.libraryType,
            sourcePath: dto.sourcePath,
            chunkCount: generatedChunkCount,
            groupId: dto.groupId ?? null,
            fileType,
            extractionMode: isScan ? 'ocr' : 'text',
            uploadedAt: '2026-04-26 12:30',
            indexStatus: 'ready',
            chunkStrategy: 'structure-first',
            parserTarget: 'multimodal-parser',
            embeddingTarget: 'bge-large-zh',
            vectorStoreTarget: 'pgvector',
            pipelineStage: isScan ? 'ocr' : 'indexed',
        };
        this.documents.push(document);
        const generatedChunks = this.buildChunksForDocument(document);
        this.chunks.push(...generatedChunks);
        this.localStateService.saveDocuments(this.documents);
        this.localStateService.saveChunks(this.chunks);
        if (dto.libraryType === 'private') {
            const group = this.groupsService.getGroupById(dto.groupId);
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
    removeGroupDocuments(groupId) {
        const remainingDocuments = this.documents.filter((document) => document.groupId !== groupId);
        const remainingChunks = this.chunks.filter((chunk) => chunk.groupId !== groupId);
        this.documents.splice(0, this.documents.length, ...remainingDocuments);
        this.chunks.splice(0, this.chunks.length, ...remainingChunks);
        this.localStateService.saveDocuments(this.documents);
        this.localStateService.saveChunks(this.chunks);
        const privateDocumentCount = this.documents.filter((document) => document.libraryType === 'private').length;
        this.subscriptionsService.syncUsage({ privateDocuments: privateDocumentCount });
    }
    getLibraryScopeSummary(groupId) {
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
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groups_service_1.GroupsService,
        local_state_service_1.LocalStateService,
        subscriptions_service_1.SubscriptionsService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map