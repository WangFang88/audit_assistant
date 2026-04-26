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
exports.ConversationParticipantEntity = void 0;
const typeorm_1 = require("typeorm");
let ConversationParticipantEntity = class ConversationParticipantEntity {
};
exports.ConversationParticipantEntity = ConversationParticipantEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id', type: 'bigint' }),
    __metadata("design:type", String)
], ConversationParticipantEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ConversationParticipantEntity.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ConversationParticipantEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'joined_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], ConversationParticipantEntity.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_read_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], ConversationParticipantEntity.prototype, "lastReadAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unread_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ConversationParticipantEntity.prototype, "unreadCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 16, default: 'active' }),
    __metadata("design:type", String)
], ConversationParticipantEntity.prototype, "status", void 0);
exports.ConversationParticipantEntity = ConversationParticipantEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'conversation_participants' })
], ConversationParticipantEntity);
//# sourceMappingURL=conversation-participant.entity.js.map