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
exports.DocumentChunkEntity = void 0;
const typeorm_1 = require("typeorm");
let DocumentChunkEntity = class DocumentChunkEntity {
};
exports.DocumentChunkEntity = DocumentChunkEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'chunk_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], DocumentChunkEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'doc_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], DocumentChunkEntity.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], DocumentChunkEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'library_type', type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], DocumentChunkEntity.prototype, "libraryType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'title', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], DocumentChunkEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chapter_title', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], DocumentChunkEntity.prototype, "chapterTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'article_ref', type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], DocumentChunkEntity.prototype, "articleRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'page_label', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], DocumentChunkEntity.prototype, "pageLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content', type: 'text' }),
    __metadata("design:type", String)
], DocumentChunkEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'keywords', type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], DocumentChunkEntity.prototype, "keywords", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chunk_index', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DocumentChunkEntity.prototype, "chunkIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'index_status', type: 'varchar', length: 16, default: 'processing' }),
    __metadata("design:type", String)
], DocumentChunkEntity.prototype, "indexStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DocumentChunkEntity.prototype, "tokenCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], DocumentChunkEntity.prototype, "createdAt", void 0);
exports.DocumentChunkEntity = DocumentChunkEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'document_chunks' })
], DocumentChunkEntity);
//# sourceMappingURL=document-chunk.entity.js.map