"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const document_chunk_entity_1 = require("../../database/entities/document-chunk.entity");
const document_entity_1 = require("../../database/entities/document.entity");
const document_extraction_job_entity_1 = require("../../database/entities/document-extraction-job.entity");
const audit_module_1 = require("../audit/audit.module");
const auth_module_1 = require("../auth/auth.module");
const groups_module_1 = require("../groups/groups.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const documents_controller_1 = require("./documents.controller");
const documents_service_1 = require("./documents.service");
const file_storage_service_1 = require("./file-storage.service");
const text_extraction_service_1 = require("./text-extraction.service");
const case_chunk_processor_service_1 = require("./case-chunk-processor.service");
const embedding_service_1 = require("./embedding.service");
let DocumentsModule = class DocumentsModule {
};
exports.DocumentsModule = DocumentsModule;
exports.DocumentsModule = DocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([document_entity_1.DocumentEntity, document_chunk_entity_1.DocumentChunkEntity, document_extraction_job_entity_1.DocumentExtractionJobEntity]), audit_module_1.AuditModule, auth_module_1.AuthModule, (0, common_1.forwardRef)(() => groups_module_1.GroupsModule), subscriptions_module_1.SubscriptionsModule],
        controllers: [documents_controller_1.DocumentsController],
        providers: [documents_service_1.DocumentsService, file_storage_service_1.FileStorageService, text_extraction_service_1.TextExtractionService, case_chunk_processor_service_1.CaseChunkProcessorService, embedding_service_1.EmbeddingService],
        exports: [documents_service_1.DocumentsService, embedding_service_1.EmbeddingService, file_storage_service_1.FileStorageService],
    })
], DocumentsModule);
//# sourceMappingURL=documents.module.js.map