"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryLogRepository = void 0;
const common_1 = require("@nestjs/common");
const query_log_entity_1 = require("../entities/query-log.entity");
let QueryLogRepository = class QueryLogRepository {
    createEntity(snapshot) {
        const entity = new query_log_entity_1.QueryLogEntity();
        entity.id = snapshot.id;
        entity.userId = snapshot.userId;
        entity.teamId = snapshot.teamId;
        entity.queryText = snapshot.queryText;
        entity.queriedAt = new Date(snapshot.queriedAt.replace(' ', 'T'));
        entity.consumedQuota = snapshot.consumedQuota;
        return entity;
    }
    mapEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            teamId: entity.teamId,
            queryText: entity.queryText,
            queriedAt: entity.queriedAt.toISOString().slice(0, 19).replace('T', ' '),
            consumedQuota: entity.consumedQuota,
        };
    }
};
exports.QueryLogRepository = QueryLogRepository;
exports.QueryLogRepository = QueryLogRepository = __decorate([
    (0, common_1.Injectable)()
], QueryLogRepository);
//# sourceMappingURL=query-log.repository.js.map