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
exports.ConversationEntity = void 0;
const typeorm_1 = require("typeorm");
let ConversationEntity = class ConversationEntity {
};
exports.ConversationEntity = ConversationEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'conversation_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_type', type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "conversationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'title', type: 'varchar', length: 160 }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'agent_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "lastMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 16, default: 'active' }),
    __metadata("design:type", String)
], ConversationEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], ConversationEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], ConversationEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ConversationEntity.prototype, "deletedAt", void 0);
exports.ConversationEntity = ConversationEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'conversations' })
], ConversationEntity);
//# sourceMappingURL=conversation.entity.js.map