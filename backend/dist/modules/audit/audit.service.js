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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_event_entity_1 = require("../../database/entities/audit-event.entity");
const audit_event_repository_1 = require("../../database/repositories/audit-event.repository");
let AuditService = class AuditService {
    constructor(auditEventEntityRepository, auditEventRepository) {
        this.auditEventEntityRepository = auditEventEntityRepository;
        this.auditEventRepository = auditEventRepository;
    }
    async recordEvent(input) {
        const snapshot = {
            id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            eventType: input.eventType,
            actorUserId: input.actorUserId,
            actorName: input.actorName,
            targetType: input.targetType,
            targetId: input.targetId ?? null,
            groupId: input.groupId ?? null,
            summary: input.summary,
            status: input.status ?? 'success',
            detail: input.detail ?? {},
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };
        await this.auditEventEntityRepository.save(this.auditEventRepository.createEntity(snapshot));
        return snapshot;
    }
    async listRecentEvents(limit = 10, filter) {
        const qb = this.auditEventEntityRepository.createQueryBuilder('e').orderBy('e.createdAt', 'DESC').take(limit);
        if (filter && !filter.isAdmin) {
            if (filter.groupIds && filter.groupIds.length > 0) {
                qb.where('(e.actorUserId = :userId OR e.groupId IN (:...groupIds))', {
                    userId: filter.userId,
                    groupIds: filter.groupIds,
                });
            }
            else {
                qb.where('e.actorUserId = :userId', { userId: filter.userId });
            }
        }
        const entities = await qb.getMany();
        return entities.map((entity) => this.auditEventRepository.mapEntity(entity));
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_event_entity_1.AuditEventEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_event_repository_1.AuditEventRepository])
], AuditService);
//# sourceMappingURL=audit.service.js.map