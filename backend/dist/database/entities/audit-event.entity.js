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
exports.AuditEventEntity = void 0;
const typeorm_1 = require("typeorm");
let AuditEventEntity = class AuditEventEntity {
};
exports.AuditEventEntity = AuditEventEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'event_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_name', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "actorName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_type', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], AuditEventEntity.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'group_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], AuditEventEntity.prototype, "groupId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'summary', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 16, default: 'success' }),
    __metadata("design:type", String)
], AuditEventEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'detail', type: 'jsonb', default: () => "'{}'" }),
    __metadata("design:type", Object)
], AuditEventEntity.prototype, "detail", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], AuditEventEntity.prototype, "createdAt", void 0);
exports.AuditEventEntity = AuditEventEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'audit_events' })
], AuditEventEntity);
//# sourceMappingURL=audit-event.entity.js.map