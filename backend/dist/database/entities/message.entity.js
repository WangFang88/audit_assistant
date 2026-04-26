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
exports.MessageEntity = void 0;
const typeorm_1 = require("typeorm");
let MessageEntity = class MessageEntity {
};
exports.MessageEntity = MessageEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'message_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], MessageEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], MessageEntity.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_user_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], MessageEntity.prototype, "senderUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_agent_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], MessageEntity.prototype, "senderAgentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_type', type: 'varchar', length: 16, default: 'user' }),
    __metadata("design:type", String)
], MessageEntity.prototype, "senderType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content', type: 'text' }),
    __metadata("design:type", String)
], MessageEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'message_type', type: 'varchar', length: 16, default: 'text' }),
    __metadata("design:type", String)
], MessageEntity.prototype, "messageType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], MessageEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'sent_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], MessageEntity.prototype, "sentAt", void 0);
exports.MessageEntity = MessageEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'messages' })
], MessageEntity);
//# sourceMappingURL=message.entity.js.map