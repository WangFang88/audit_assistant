"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEventRepository = void 0;
const common_1 = require("@nestjs/common");
const audit_event_entity_1 = require("../entities/audit-event.entity");
let AuditEventRepository = class AuditEventRepository {
    createEntity(snapshot) {
        const entity = new audit_event_entity_1.AuditEventEntity();
        entity.id = snapshot.id;
        entity.eventType = snapshot.eventType;
        entity.actorUserId = snapshot.actorUserId;
        entity.actorName = snapshot.actorName;
        entity.targetType = snapshot.targetType;
        entity.targetId = snapshot.targetId;
        entity.groupId = snapshot.groupId;
        entity.summary = snapshot.summary;
        entity.status = snapshot.status;
        entity.detail = snapshot.detail;
        entity.createdAt = new Date(snapshot.createdAt.replace(' ', 'T'));
        return entity;
    }
    mapEntity(entity) {
        return {
            id: entity.id,
            eventType: entity.eventType,
            actorUserId: entity.actorUserId,
            actorName: entity.actorName,
            targetType: entity.targetType,
            targetId: entity.targetId,
            groupId: entity.groupId,
            summary: entity.summary,
            status: entity.status,
            detail: entity.detail ?? {},
            createdAt: entity.createdAt.toISOString().slice(0, 19).replace('T', ' '),
        };
    }
};
exports.AuditEventRepository = AuditEventRepository;
exports.AuditEventRepository = AuditEventRepository = __decorate([
    (0, common_1.Injectable)()
], AuditEventRepository);
//# sourceMappingURL=audit-event.repository.js.map