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
exports.PrivateMessageEntity = void 0;
const typeorm_1 = require("typeorm");
let PrivateMessageEntity = class PrivateMessageEntity {
};
exports.PrivateMessageEntity = PrivateMessageEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'msg_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PrivateMessageEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PrivateMessageEntity.prototype, "senderUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receiver_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], PrivateMessageEntity.prototype, "receiverUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content', type: 'text' }),
    __metadata("design:type", String)
], PrivateMessageEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'sent_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], PrivateMessageEntity.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'read_status', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PrivateMessageEntity.prototype, "readStatus", void 0);
exports.PrivateMessageEntity = PrivateMessageEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'private_messages' })
], PrivateMessageEntity);
//# sourceMappingURL=private-message.entity.js.map