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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageDto = exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const class_validator_1 = require("class-validator");
const typeorm_2 = require("typeorm");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const message_entity_1 = require("../../database/entities/message.entity");
const auth_service_1 = require("../auth/auth.service");
const groups_service_1 = require("../groups/groups.service");
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsIn)(['group', 'direct', 'agent']),
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
    constructor(conversationRepository, messageRepository, authService, groupsService) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
        this.groupsService = groupsService;
    }
    formatDateTime(date) {
        return date.toISOString().slice(0, 16).replace('T', ' ');
    }
    assertAdminCannotUseChat() {
        if (!this.authService.isAdmin()) {
            return;
        }
        throw new common_1.ForbiddenException('管理员不参与项目组协作，无法使用对话功能');
    }
    async ensureSeedData() {
        const conversationCount = await this.conversationRepository.count();
        if (conversationCount > 0) {
            return;
        }
        await this.conversationRepository.save([
            this.conversationRepository.create({
                id: 'conv-group-1',
                conversationType: 'group',
                title: '某区财政局审计组群聊',
                teamId: 'group-1',
                agentId: null,
                createdBy: 'user-2',
                lastMessage: '请同步采购抽查结果。',
                lastMessageAt: new Date('2026-04-25T16:40:00'),
                status: 'active',
                deletedAt: null,
            }),
            this.conversationRepository.create({
                id: 'conv-agent-1',
                conversationType: 'agent',
                title: '某区财政局审计组 Agent',
                teamId: 'group-1',
                agentId: 'team-agent-group-1',
                createdBy: 'user-2',
                lastMessage: '请结合当前项目私有制度，解释采购审批与专项资金使用的核查重点。',
                lastMessageAt: new Date('2026-04-25T16:55:00'),
                status: 'active',
                deletedAt: null,
            }),
            this.conversationRepository.create({
                id: 'conv-direct-1',
                conversationType: 'direct',
                title: '与法规顾问的私信',
                teamId: null,
                agentId: null,
                createdBy: 'user-2',
                lastMessage: '我已整理出相关条款。',
                lastMessageAt: new Date('2026-04-25T15:20:00'),
                status: 'active',
                deletedAt: null,
            }),
        ]);
        await this.messageRepository.save([
            this.messageRepository.create({
                id: 'msg-1',
                conversationId: 'conv-group-1',
                senderUserId: 'user-2',
                senderAgentId: null,
                senderType: 'user',
                content: '请同步采购抽查结果。',
                messageType: 'text',
                metadata: { senderName: '审计组长', readStatus: true },
                sentAt: new Date('2026-04-25T16:40:00'),
            }),
            this.messageRepository.create({
                id: 'msg-2',
                conversationId: 'conv-direct-1',
                senderUserId: 'user-4',
                senderAgentId: null,
                senderType: 'user',
                content: '我已整理出相关条款。',
                messageType: 'text',
                metadata: { senderName: '法规顾问', readStatus: false },
                sentAt: new Date('2026-04-25T15:20:00'),
            }),
            this.messageRepository.create({
                id: 'msg-3',
                conversationId: 'conv-agent-1',
                senderUserId: 'user-2',
                senderAgentId: null,
                senderType: 'user',
                content: '请结合当前项目私有制度，解释采购审批与专项资金使用的核查重点。',
                messageType: 'text',
                metadata: { senderName: '审计组长', readStatus: true },
                sentAt: new Date('2026-04-25T16:55:00'),
            }),
        ]);
    }
    toConversationRecord(entity) {
        return {
            id: entity.id,
            type: entity.conversationType,
            title: entity.title,
            groupId: entity.teamId,
            agentId: entity.agentId,
        };
    }
    toMessageRecord(entity, conversation) {
        const metadata = entity.metadata ?? {};
        const senderName = typeof metadata.senderName === 'string'
            ? metadata.senderName
            : entity.senderType === 'agent'
                ? conversation.title
                : '未知发送者';
        return {
            id: entity.id,
            conversationId: entity.conversationId,
            senderUserId: entity.senderUserId,
            senderAgentId: entity.senderAgentId,
            senderName,
            content: entity.content,
            sentAt: this.formatDateTime(entity.sentAt),
            readStatus: metadata.readStatus !== false,
        };
    }
    toPublicConversation(conversation, messages) {
        return {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            groupId: conversation.groupId,
            isTeamAgent: conversation.type === 'agent',
            unreadCount: messages.filter((message) => !message.readStatus).length,
            lastMessage: messages[messages.length - 1]?.content ?? '',
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
    async getConversationById(conversationId) {
        await this.ensureSeedData();
        const entity = await this.conversationRepository.findOneBy({ id: conversationId, status: 'active' });
        if (!entity) {
            throw new common_1.NotFoundException('会话不存在');
        }
        return this.toConversationRecord(entity);
    }
    async getConversationMessages(conversationId, conversation) {
        const entities = await this.messageRepository.find({
            where: { conversationId },
            order: { sentAt: 'ASC' },
        });
        return entities.map((entity) => this.toMessageRecord(entity, conversation));
    }
    async updateConversationLastMessage(conversationId, content, sentAt) {
        await this.conversationRepository.update({ id: conversationId }, {
            lastMessage: content,
            lastMessageAt: sentAt,
        });
    }
    async getDirectConversationPeerUserId(conversationId, currentUserId) {
        const messages = await this.messageRepository.find({
            where: { conversationId, senderType: 'user' },
            order: { sentAt: 'ASC' },
        });
        const peerMessage = messages.find((message) => message.senderUserId != null && message.senderUserId !== currentUserId);
        return peerMessage?.senderUserId ?? null;
    }
    async listConversations(groupId) {
        this.assertAdminCannotUseChat();
        await this.ensureSeedData();
        if (groupId != null) {
            this.groupsService.assertCanAccessGroup(groupId);
        }
        const entities = await this.conversationRepository.find({
            where: { status: 'active' },
            order: { lastMessageAt: 'DESC', createdAt: 'ASC' },
        });
        const conversations = entities.map((entity) => this.toConversationRecord(entity));
        const visibleConversations = conversations
            .filter((conversation) => {
            if (conversation.type === 'direct') {
                return true;
            }
            return groupId != null && conversation.groupId === groupId;
        })
            .sort((a, b) => {
            if (a.type === 'agent' && b.type !== 'agent') {
                return -1;
            }
            if (a.type !== 'agent' && b.type === 'agent') {
                return 1;
            }
            return 0;
        });
        const items = await Promise.all(visibleConversations.map(async (conversation) => {
            const messages = await this.getConversationMessages(conversation.id, conversation);
            return this.toPublicConversation(conversation, messages);
        }));
        return items;
    }
    async listMessages(conversationId) {
        this.assertAdminCannotUseChat();
        const conversation = await this.getConversationById(conversationId);
        this.assertCanAccessConversation(conversation);
        const messages = await this.getConversationMessages(conversationId, conversation);
        return messages.map((message) => this.toPublicMessage(message));
    }
    async sendMessage(dto) {
        this.assertAdminCannotUseChat();
        const conversation = await this.getConversationById(dto.conversationId);
        if (conversation.type !== dto.conversationType) {
            throw new common_1.ForbiddenException('当前会话类型与发送目标不一致');
        }
        this.assertCanAccessConversation(conversation, dto.groupId);
        const currentUser = this.authService.me();
        const receiverUserId = conversation.type === 'direct'
            ? (await this.getDirectConversationPeerUserId(dto.conversationId, currentUser.id)) ?? currentUser.id
            : null;
        const sentAt = new Date();
        const messageEntity = this.messageRepository.create({
            id: `msg-${Date.now()}`,
            conversationId: dto.conversationId,
            senderUserId: currentUser.id,
            senderAgentId: null,
            senderType: 'user',
            content: dto.content,
            messageType: 'text',
            metadata: {
                senderName: currentUser.name,
                readStatus: conversation.type !== 'direct',
                receiverUserId,
            },
            sentAt,
        });
        const savedMessage = await this.messageRepository.save(messageEntity);
        await this.updateConversationLastMessage(dto.conversationId, dto.content, sentAt);
        if (conversation.type === 'agent') {
            const replySentAt = new Date();
            await this.messageRepository.save(this.messageRepository.create({
                id: `msg-${Date.now() + 1}`,
                conversationId: dto.conversationId,
                senderUserId: null,
                senderAgentId: conversation.agentId,
                senderType: 'agent',
                content: '已收到本次提问。当前项目组 Agent 将在公共库与本组私有库范围内完成检索，并返回可溯源依据。',
                messageType: 'text',
                metadata: {
                    senderName: conversation.title,
                    readStatus: true,
                },
                sentAt: replySentAt,
            }));
            await this.updateConversationLastMessage(dto.conversationId, '已收到本次提问。当前项目组 Agent 将在公共库与本组私有库范围内完成检索，并返回可溯源依据。', replySentAt);
        }
        return this.toPublicMessage(this.toMessageRecord(savedMessage, conversation));
    }
    async createAgentConversation(group) {
        await this.ensureSeedData();
        const existing = await this.conversationRepository.findOneBy({
            conversationType: 'agent',
            teamId: group.id,
            status: 'active',
        });
        if (existing) {
            existing.title = `${group.name} Agent`;
            const saved = await this.conversationRepository.save(existing);
            return this.toConversationRecord(saved);
        }
        const conversation = this.conversationRepository.create({
            id: `conv-agent-${group.id}`,
            conversationType: 'agent',
            title: `${group.name} Agent`,
            teamId: group.id,
            agentId: null,
            createdBy: this.authService.me().id,
            lastMessage: null,
            lastMessageAt: null,
            status: 'active',
            deletedAt: null,
        });
        const saved = await this.conversationRepository.save(conversation);
        return this.toConversationRecord(saved);
    }
    async removeGroupConversations(groupId) {
        await this.ensureSeedData();
        const conversations = await this.conversationRepository.find({
            where: { teamId: groupId },
        });
        if (conversations.length === 0) {
            return;
        }
        const conversationIds = conversations.map((conversation) => conversation.id);
        await this.messageRepository.delete(conversationIds.map((conversationId) => ({ conversationId })));
        await this.conversationRepository.delete(conversationIds.map((id) => ({ id })));
    }
    async syncGroupAgent(group, agent) {
        const conversation = await this.createAgentConversation(group);
        await this.conversationRepository.update({ id: conversation.id }, {
            title: agent.name,
            agentId: agent.id,
        });
        return conversation.id;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.ConversationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(message_entity_1.MessageEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService,
        groups_service_1.GroupsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map