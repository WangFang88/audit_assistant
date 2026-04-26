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
const auth_service_1 = require("../auth/auth.service");
const groups_service_1 = require("../groups/groups.service");
const local_state_service_1 = require("../subscriptions/local-state.service");
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
    constructor(authService, groupsService, localStateService) {
        this.authService = authService;
        this.groupsService = groupsService;
        this.localStateService = localStateService;
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
        const persistedState = this.localStateService.readState();
        if (persistedState.conversations) {
            this.conversations.splice(0, this.conversations.length, ...persistedState.conversations);
        }
        if (persistedState.messages) {
            this.messages.splice(0, this.messages.length, ...persistedState.messages);
        }
    }
    assertAdminCannotUseChat() {
        if (!this.authService.isAdmin()) {
            return;
        }
        throw new common_1.ForbiddenException('管理员不参与项目组协作，无法使用对话功能');
    }
    persistState() {
        this.localStateService.saveChatState(this.conversations, this.messages);
    }
    assertCanAccessConversation(conversation, groupId) {
        if (conversation.type === 'direct') {
            return;
        }
        if (conversation.groupId == null) {
            throw new common_1.ForbiddenException('当前群聊未绑定项目组，暂不可访问');
        }
        this.groupsService.assertCanAccessGroup(conversation.groupId);
        if (groupId != null && conversation.groupId !== groupId) {
            throw new common_1.ForbiddenException('当前会话不属于所选项目组');
        }
    }
    getConversationById(conversationId) {
        const conversation = this.conversations.find((item) => item.id === conversationId);
        if (!conversation) {
            throw new common_1.NotFoundException('会话不存在');
        }
        return conversation;
    }
    listConversations(groupId) {
        this.assertAdminCannotUseChat();
        if (groupId != null) {
            this.groupsService.assertCanAccessGroup(groupId);
        }
        return this.conversations.filter((conversation) => {
            if (conversation.type === 'direct') {
                return true;
            }
            return groupId != null && conversation.groupId === groupId;
        });
    }
    listMessages(conversationId) {
        this.assertAdminCannotUseChat();
        const conversation = this.getConversationById(conversationId);
        this.assertCanAccessConversation(conversation);
        return this.messages.filter((message) => message.conversationId === conversationId);
    }
    sendMessage(dto) {
        this.assertAdminCannotUseChat();
        const conversation = this.getConversationById(dto.conversationId);
        if (conversation.type !== dto.conversationType) {
            throw new common_1.ForbiddenException('当前会话类型与发送目标不一致');
        }
        this.assertCanAccessConversation(conversation, dto.groupId);
        const currentUser = this.authService.me();
        const message = {
            id: `msg-${this.messages.length + 1}`,
            conversationId: dto.conversationId,
            senderName: currentUser.name,
            content: dto.content,
            sentAt: '2026-04-26 13:30',
            conversationType: dto.conversationType,
            groupId: conversation.groupId,
        };
        this.messages.push({
            id: message.id,
            conversationId: message.conversationId,
            senderName: message.senderName,
            content: message.content,
            sentAt: message.sentAt,
        });
        conversation.lastMessage = dto.content;
        conversation.unreadCount = 0;
        this.persistState();
        return message;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        groups_service_1.GroupsService,
        local_state_service_1.LocalStateService])
], ChatService);
//# sourceMappingURL=chat.service.js.map