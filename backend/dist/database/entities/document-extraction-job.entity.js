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
exports.DocumentExtractionJobEntity = void 0;
const typeorm_1 = require("typeorm");
let DocumentExtractionJobEntity = class DocumentExtractionJobEntity {
};
exports.DocumentExtractionJobEntity = DocumentExtractionJobEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'job_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], DocumentExtractionJobEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'doc_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], DocumentExtractionJobEntity.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], DocumentExtractionJobEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 16, default: 'queued' }),
    __metadata("design:type", String)
], DocumentExtractionJobEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'stage', type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], DocumentExtractionJobEntity.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'progress', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DocumentExtractionJobEntity.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DocumentExtractionJobEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'started_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], DocumentExtractionJobEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'finished_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DocumentExtractionJobEntity.prototype, "finishedAt", void 0);
exports.DocumentExtractionJobEntity = DocumentExtractionJobEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'document_extraction_jobs' })
], DocumentExtractionJobEntity);
//# sourceMappingURL=document-extraction-job.entity.js.map