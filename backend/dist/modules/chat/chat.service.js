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
const message_repository_1 = require("../../database/repositories/message.repository");
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
    constructor(authService, groupsService, localStateService, messageRepository) {
        this.authService = authService;
        this.groupsService = groupsService;
        this.localStateService = localStateService;
        this.messageRepository = messageRepository;
        this.conversations = [
            {
                id: 'conv-group-1',
                type: 'group',
                title: '某区财政局审计组群聊',
                groupId: 'group-1',
            },
            {
                id: 'conv-direct-1',
                type: 'direct',
                title: '与法规顾问的私信',
                groupId: null,
            },
        ];
        this.messages = [
            {
                id: 'msg-1',
                conversationId: 'conv-group-1',
                senderUserId: 'user-2',
                receiverUserId: null,
                senderName: '审计组长',
                content: '请同步采购抽查结果。',
                sentAt: '2026-04-25 16:40',
                readStatus: true,
            },
            {
                id: 'msg-2',
                conversationId: 'conv-direct-1',
                senderUserId: 'user-4',
                receiverUserId: 'user-2',
                senderName: '法规顾问',
                content: '我已整理出相关条款。',
                sentAt: '2026-04-25 15:20',
                readStatus: false,
            },
        ];
        const persistedState = this.localStateService.readState();
        if (persistedState.conversations) {
            this.conversations.splice(0, this.conversations.length, ...persistedState.conversations.map((conversation) => ({
                id: conversation.id,
                type: conversation.type,
                title: conversation.title,
                groupId: conversation.groupId,
            })));
        }
        if (persistedState.messages) {
            this.messages.splice(0, this.messages.length, ...persistedState.messages.map((message) => ({
                id: message.id,
                conversationId: message.conversationId,
                senderUserId: message.senderUserId ?? this.resolveLegacySenderUserId(message.senderName),
                receiverUserId: message.receiverUserId ?? this.resolveLegacyReceiverUserId(message.conversationId, message.senderName),
                senderName: message.senderName,
                content: message.content,
                sentAt: message.sentAt,
                readStatus: message.readStatus ?? false,
            })));
        }
    }
    resolveLegacySenderUserId(senderName) {
        const directConversation = this.conversations.find((conversation) => conversation.type === 'direct' && conversation.title.includes(senderName));
        if (directConversation?.title.includes('法规顾问')) {
            return 'user-4';
        }
        if (directConversation?.title.includes('审计助理')) {
            return 'user-3';
        }
        if (directConversation?.title.includes('审计组长')) {
            return 'user-2';
        }
        return senderName === '法规顾问' ? 'user-4' : senderName === '审计助理' ? 'user-3' : 'user-2';
    }
    resolveLegacyReceiverUserId(conversationId, senderName) {
        const conversation = this.conversations.find((item) => item.id === conversationId);
        if (conversation?.type !== 'direct') {
            return null;
        }
        const senderUserId = this.resolveLegacySenderUserId(senderName);
        const currentUserId = this.authService.me().id;
        return senderUserId === currentUserId ? null : currentUserId;
    }
    assertAdminCannotUseChat() {
        if (!this.authService.isAdmin()) {
            return;
        }
        throw new common_1.ForbiddenException('管理员不参与项目组协作，无法使用对话功能');
    }
    toGroupMessageSnapshot(message, groupId) {
        return {
            id: message.id,
            teamId: groupId,
            senderUserId: message.senderUserId,
            senderName: message.senderName,
            conversationId: message.conversationId,
            content: message.content,
            sentAt: message.sentAt,
        };
    }
    toPrivateMessageSnapshot(message) {
        return {
            id: message.id,
            senderUserId: message.senderUserId,
            receiverUserId: message.receiverUserId ?? 'unknown-user',
            senderName: message.senderName,
            conversationId: message.conversationId,
            content: message.content,
            sentAt: message.sentAt,
            readStatus: message.readStatus,
        };
    }
    getDirectConversationPeerUserId(conversationId, currentUserId) {
        const peerMessage = this.messages.find((message) => message.conversationId === conversationId && message.senderUserId !== currentUserId);
        return peerMessage?.senderUserId ?? null;
    }
    getConversationUnreadCount(conversationId) {
        return this.messages.filter((message) => message.conversationId === conversationId && !message.readStatus).length;
    }
    getConversationLastMessage(conversationId) {
        const conversationMessages = this.messages.filter((message) => message.conversationId === conversationId);
        return conversationMessages[conversationMessages.length - 1]?.content ?? '';
    }
    toPublicConversation(conversation) {
        return {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            groupId: conversation.groupId,
            unreadCount: this.getConversationUnreadCount(conversation.id),
            lastMessage: this.getConversationLastMessage(conversation.id),
        };
    }
    toPublicMessage(message) {
        return {
            id: message.id,
            conversationId: message.conversationId,
            senderName: message.senderName,
            content: message.content,
            sentAt: message.sentAt,
        };
    }
    persistState() {
        const persistedMessages = this.messages.map((message) => {
            const conversation = this.getConversationById(message.conversationId);
            if (conversation.type === 'group') {
                const entity = this.messageRepository.createGroupMessageEntity(this.toGroupMessageSnapshot(message, conversation.groupId ?? 'unknown-group'));
                const snapshot = this.messageRepository.mapGroupMessageEntity(entity, {
                    senderName: message.senderName,
                    conversationId: message.conversationId,
                });
                return {
                    id: snapshot.id,
                    conversationId: snapshot.conversationId,
                    senderUserId: snapshot.senderUserId,
                    receiverUserId: null,
                    senderName: snapshot.senderName,
                    content: snapshot.content,
                    sentAt: snapshot.sentAt,
                    readStatus: true,
                };
            }
            const entity = this.messageRepository.createPrivateMessageEntity(this.toPrivateMessageSnapshot(message));
            const snapshot = this.messageRepository.mapPrivateMessageEntity(entity, {
                senderName: message.senderName,
                conversationId: message.conversationId,
            });
            return {
                id: snapshot.id,
                conversationId: snapshot.conversationId,
                senderUserId: snapshot.senderUserId,
                receiverUserId: snapshot.receiverUserId,
                senderName: snapshot.senderName,
                content: snapshot.content,
                sentAt: snapshot.sentAt,
                readStatus: snapshot.readStatus,
            };
        });
        this.localStateService.saveChatState(this.conversations.map((conversation) => ({
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            groupId: conversation.groupId,
        })), persistedMessages);
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
        return this.conversations
            .filter((conversation) => {
            if (conversation.type === 'direct') {
                return true;
            }
            return groupId != null && conversation.groupId === groupId;
        })
            .map((conversation) => this.toPublicConversation(conversation));
    }
    listMessages(conversationId) {
        this.assertAdminCannotUseChat();
        const conversation = this.getConversationById(conversationId);
        this.assertCanAccessConversation(conversation);
        return this.messages
            .filter((message) => message.conversationId === conversationId)
            .map((message) => this.toPublicMessage(message));
    }
    sendMessage(dto) {
        this.assertAdminCannotUseChat();
        const conversation = this.getConversationById(dto.conversationId);
        if (conversation.type !== dto.conversationType) {
            throw new common_1.ForbiddenException('当前会话类型与发送目标不一致');
        }
        this.assertCanAccessConversation(conversation, dto.groupId);
        const currentUser = this.authService.me();
        const receiverUserId = conversation.type === 'direct'
            ? this.getDirectConversationPeerUserId(dto.conversationId, currentUser.id) ?? currentUser.id
            : null;
        const message = {
            id: `msg-${this.messages.length + 1}`,
            conversationId: dto.conversationId,
            senderUserId: currentUser.id,
            receiverUserId,
            senderName: currentUser.name,
            content: dto.content,
            sentAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            readStatus: conversation.type === 'group',
            conversationType: dto.conversationType,
            groupId: conversation.groupId,
        };
        this.messages.push({
            id: message.id,
            conversationId: message.conversationId,
            senderUserId: message.senderUserId,
            receiverUserId: message.receiverUserId,
            senderName: message.senderName,
            content: message.content,
            sentAt: message.sentAt,
            readStatus: message.readStatus,
        });
        this.persistState();
        return this.toPublicMessage(message);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        groups_service_1.GroupsService,
        local_state_service_1.LocalStateService,
        message_repository_1.MessageRepository])
], ChatService);
//# sourceMappingURL=chat.service.js.map