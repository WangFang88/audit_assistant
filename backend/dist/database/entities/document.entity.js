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
exports.DocumentEntity = void 0;
const typeorm_1 = require("typeorm");
let DocumentEntity = class DocumentEntity {
};
exports.DocumentEntity = DocumentEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'doc_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'title', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', type: 'varchar', length: 32, default: 'pdf' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'library_type', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "libraryType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'region', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'upload_source', type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "uploadSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'index_status', type: 'varchar', length: 32, default: 'queued' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "indexStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extraction_mode', type: 'varchar', length: 16, nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "extractionMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parser_target', type: 'varchar', length: 64, default: 'multimodal-parser' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "parserTarget", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'embedding_target', type: 'varchar', length: 64, default: 'bge-large-zh' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "embeddingTarget", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vector_store_target', type: 'varchar', length: 64, default: 'pgvector' }),
    __metadata("design:type", String)
], DocumentEntity.prototype, "vectorStoreTarget", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chunk_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DocumentEntity.prototype, "chunkCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_text_length', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DocumentEntity.prototype, "rawTextLength", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], DocumentEntity.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'indexed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "indexedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DocumentEntity.prototype, "deletedAt", void 0);
exports.DocumentEntity = DocumentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'documents' })
], DocumentEntity);
//# sourceMappingURL=document.entity.js.map