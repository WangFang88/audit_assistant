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
exports.TeamAgentEntity = void 0;
const typeorm_1 = require("typeorm");
let TeamAgentEntity = class TeamAgentEntity {
};
exports.TeamAgentEntity = TeamAgentEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'agent_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TeamAgentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64, unique: true }),
    __metadata("design:type", String)
], TeamAgentEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 160 }),
    __metadata("design:type", String)
], TeamAgentEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 16, default: 'active' }),
    __metadata("design:type", String)
], TeamAgentEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retrieval_scope', type: 'varchar', length: 64, default: 'public_plus_group_private' }),
    __metadata("design:type", String)
], TeamAgentEntity.prototype, "retrievalScope", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'capabilities', type: 'jsonb', default: () => "'[]'::jsonb" }),
    __metadata("design:type", Array)
], TeamAgentEntity.prototype, "capabilities", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_conversation_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], TeamAgentEntity.prototype, "defaultConversationId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], TeamAgentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], TeamAgentEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeamAgentEntity.prototype, "deletedAt", void 0);
exports.TeamAgentEntity = TeamAgentEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'team_agents' })
], TeamAgentEntity);
//# sourceMappingURL=team-agent.entity.js.map