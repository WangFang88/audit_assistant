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
exports.PrivateDocEntity = void 0;
const typeorm_1 = require("typeorm");
let PrivateDocEntity = class PrivateDocEntity {
};
exports.PrivateDocEntity = PrivateDocEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'doc_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], PrivateDocEntity.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vector_status', type: 'varchar', length: 32, default: 'queued' }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "vectorStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'title', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PrivateDocEntity.prototype, "title", void 0);
exports.PrivateDocEntity = PrivateDocEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'private_docs' })
], PrivateDocEntity);
//# sourceMappingURL=private-doc.entity.js.map