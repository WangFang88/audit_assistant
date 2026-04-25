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
exports.SendMessageDto = exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsIn)(['group', 'direct']),
    __metadata("design:type", String)
], SendMessageDto.prototype, "conversationType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], SendMessageDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "groupId", void 0);
let ChatService = class ChatService {
    constructor() {
        this.conversations = [
            {
                id: 'conv-group-1',
                type: 'group',
                title: '某区财政局审计组群聊',
                groupId: 'group-1',
                unreadCount: 2,
                lastMessage: '请同步采购抽查结果。',
            },
            {
                id: 'conv-direct-1',
                type: 'direct',
                title: '与法规顾问的私信',
                groupId: null,
                unreadCount: 0,
                lastMessage: '我已整理出相关条款。',
            },
        ];
        this.messages = [
            {
                id: 'msg-1',
                conversationId: 'conv-group-1',
                senderName: '审计组长',
                content: '请同步采购抽查结果。',
                sentAt: '2026-04-25 16:40',
            },
            {
                id: 'msg-2',
                conversationId: 'conv-direct-1',
                senderName: '法规顾问',
                content: '我已整理出相关条款。',
                sentAt: '2026-04-25 15:20',
            },
        ];
    }
    listConversations() {
        return this.conversations;
    }
    listMessages(conversationId) {
        return this.messages.filter((message) => message.conversationId === conversationId);
    }
    sendMessage(dto) {
        return {
            id: `msg-${this.messages.length + 1}`,
            conversationId: dto.conversationId,
            senderName: '当前用户',
            content: dto.content,
            sentAt: '2026-04-25 18:30',
            conversationType: dto.conversationType,
            groupId: dto.groupId ?? null,
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)()
], ChatService);
//# sourceMappingURL=chat.service.js.map