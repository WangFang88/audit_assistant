"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const common_1 = require("@nestjs/common");
const group_message_entity_1 = require("../entities/group-message.entity");
const private_message_entity_1 = require("../entities/private-message.entity");
let MessageRepository = class MessageRepository {
    createGroupMessageEntity(snapshot) {
        const entity = new group_message_entity_1.GroupMessageEntity();
        entity.id = snapshot.id;
        entity.teamId = snapshot.teamId;
        entity.senderUserId = snapshot.senderUserId;
        entity.content = snapshot.content;
        entity.sentAt = new Date(snapshot.sentAt.replace(' ', 'T'));
        return entity;
    }
    mapGroupMessageEntity(entity, extras) {
        return {
            id: entity.id,
            teamId: entity.teamId,
            senderUserId: entity.senderUserId,
            senderName: extras.senderName,
            conversationId: extras.conversationId,
            content: entity.content,
            sentAt: this.formatDateTime(entity.sentAt),
        };
    }
    createPrivateMessageEntity(snapshot) {
        const entity = new private_message_entity_1.PrivateMessageEntity();
        entity.id = snapshot.id;
        entity.senderUserId = snapshot.senderUserId;
        entity.receiverUserId = snapshot.receiverUserId;
        entity.content = snapshot.content;
        entity.sentAt = new Date(snapshot.sentAt.replace(' ', 'T'));
        entity.readStatus = snapshot.readStatus;
        return entity;
    }
    mapPrivateMessageEntity(entity, extras) {
        return {
            id: entity.id,
            senderUserId: entity.senderUserId,
            receiverUserId: entity.receiverUserId,
            senderName: extras.senderName,
            conversationId: extras.conversationId,
            content: entity.content,
            sentAt: this.formatDateTime(entity.sentAt),
            readStatus: entity.readStatus,
        };
    }
    formatDateTime(date) {
        return date.toISOString().slice(0, 16).replace('T', ' ');
    }
};
exports.MessageRepository = MessageRepository;
exports.MessageRepository = MessageRepository = __decorate([
    (0, common_1.Injectable)()
], MessageRepository);
//# sourceMappingURL=message.repository.js.map