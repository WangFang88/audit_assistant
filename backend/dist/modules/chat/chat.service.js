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
const node_path_1 = require("node:path");
const typeorm_2 = require("typeorm");
const conversation_participant_entity_1 = require("../../database/entities/conversation-participant.entity");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const message_entity_1 = require("../../database/entities/message.entity");
const auth_service_1 = require("../auth/auth.service");
const file_storage_service_1 = require("../documents/file-storage.service");
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
    (0, class_validator_1.IsOptional)(),
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
    constructor(conversationRepository, conversationParticipantRepository, messageRepository, authService, fileStorageService, groupsService) {
        this.conversationRepository = conversationRepository;
        this.conversationParticipantRepository = conversationParticipantRepository;
        this.messageRepository = messageRepository;
        this.authService = authService;
        this.fileStorageService = fileStorageService;
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
    buildSeedConversations() {
        return [
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
        ];
    }
    buildSeedMessages() {
        return [
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
        ];
    }
    buildSeedParticipants() {
        return [
            this.conversationParticipantRepository.create({
                conversationId: 'conv-group-1',
                userId: 'user-2',
                lastReadAt: new Date('2026-04-25T16:40:00'),
                unreadCount: 0,
                status: 'active',
            }),
            this.conversationParticipantRepository.create({
                conversationId: 'conv-group-1',
                userId: 'user-3',
                lastReadAt: null,
                unreadCount: 1,
                status: 'active',
            }),
            this.conversationParticipantRepository.create({
                conversationId: 'conv-group-1',
                userId: 'user-4',
                lastReadAt: null,
                unreadCount: 1,
                status: 'active',
            }),
            this.conversationParticipantRepository.create({
                conversationId: 'conv-agent-1',
                userId: 'user-2',
                lastReadAt: new Date('2026-04-25T16:55:00'),
                unreadCount: 0,
                status: 'active',
            }),
            this.conversationParticipantRepository.create({
                conversationId: 'conv-direct-1',
                userId: 'user-2',
                lastReadAt: null,
                unreadCount: 1,
                status: 'active',
            }),
            this.conversationParticipantRepository.create({
                conversationId: 'conv-direct-1',
                userId: 'user-4',
                lastReadAt: new Date('2026-04-25T15:20:00'),
                unreadCount: 0,
                status: 'active',
            }),
        ];
    }
    async ensureConversationParticipants(conversationId, userIds) {
        const uniqueUserIds = Array.from(new Set(userIds.filter((userId) => userId.length > 0)));
        if (uniqueUserIds.length === 0) {
            return;
        }
        const existingParticipants = await this.conversationParticipantRepository.find({
            where: { conversationId },
        });
        const existingUserIds = new Set(existingParticipants.map((participant) => participant.userId));
        const missingParticipants = uniqueUserIds
            .filter((userId) => !existingUserIds.has(userId))
            .map((userId) => this.conversationParticipantRepository.create({
            conversationId,
            userId,
            lastReadAt: null,
            unreadCount: 0,
            status: 'active',
        }));
        if (missingParticipants.length > 0) {
            await this.conversationParticipantRepository.save(missingParticipants);
        }
    }
    async syncGroupConversationParticipants(groupId, userIds) {
        await this.ensureSeedData();
        const conversations = await this.conversationRepository.find({
            where: { teamId: groupId, status: 'active' },
        });
        await Promise.all(conversations.map((conversation) => this.ensureConversationParticipants(conversation.id, userIds)));
    }
    async removeUserFromGroupConversations(groupId, userId) {
        await this.ensureSeedData();
        const conversations = await this.conversationRepository.find({
            where: { teamId: groupId, status: 'active' },
        });
        if (conversations.length === 0) {
            return;
        }
        await this.conversationParticipantRepository.delete(conversations.map((conversation) => ({
            conversationId: conversation.id,
            userId,
        })));
    }
    async ensureSeedData() {
        const conversationCount = await this.conversationRepository.count();
        if (conversationCount > 0) {
            return;
        }
        await this.conversationRepository.save(this.buildSeedConversations());
        await this.messageRepository.save(this.buildSeedMessages());
        await this.conversationParticipantRepository.save(this.buildSeedParticipants());
    }
    buildFileSummary(content, fileName, mimeType, extension) {
        const normalizedMimeType = (mimeType ?? '').toLowerCase();
        const normalizedExtension = (extension ?? this.getFileExtension(fileName)).toLowerCase();
        const isImage = normalizedMimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(normalizedExtension);
        const prefix = isImage ? '[图片]' : '[文件]';
        return content.length > 0 ? `${prefix} ${content}` : `${prefix} ${fileName}`;
    }
    getFileExtension(fileName) {
        const extension = (0, node_path_1.extname)(fileName).replace('.', '').toLowerCase();
        return extension;
    }
    buildFileMetadata(file, savedFile) {
        return {
            name: savedFile.originalName,
            path: savedFile.sourcePath,
            size: file.size,
            mimeType: file.mimetype,
            extension: savedFile.extension.replace('.', '').toLowerCase() || this.getFileExtension(savedFile.originalName),
        };
    }
    async saveChatFile(conversation, messageId, file) {
        const savedFile = this.fileStorageService.saveChatFile({
            file,
            conversationId: conversation.id,
            messageId,
            conversationType: conversation.type === 'group' ? 'group' : 'direct',
        });
        return this.buildFileMetadata(file, savedFile);
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
        const metadata = (entity.metadata ?? {});
        const senderName = typeof metadata.senderName === 'string'
            ? metadata.senderName
            : entity.senderType === 'agent'
                ? conversation.title
                : '未知发送者';
        const rawFile = metadata.file;
        const file = rawFile != null && typeof rawFile === 'object'
            ? {
                name: typeof rawFile.name === 'string' ? rawFile.name : '',
                path: typeof rawFile.path === 'string' ? rawFile.path : '',
                size: typeof rawFile.size === 'number' ? rawFile.size : 0,
                mimeType: typeof rawFile.mimeType === 'string'
                    ? rawFile.mimeType
                    : '',
                extension: typeof rawFile.extension === 'string'
                    ? rawFile.extension
                    : '',
            }
            : null;
        return {
            id: entity.id,
            conversationId: entity.conversationId,
            senderUserId: entity.senderUserId,
            senderAgentId: entity.senderAgentId,
            senderName,
            content: entity.content,
            sentAt: this.formatDateTime(entity.sentAt),
            readStatus: metadata.readStatus !== false,
            messageType: entity.messageType,
            file,
        };
    }
    toPublicConversation(conversation, messages, unreadCount) {
        return {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            groupId: conversation.groupId,
            isTeamAgent: conversation.type === 'agent',
            unreadCount,
            lastMessage: this.buildConversationPreview(messages[messages.length - 1]) ?? '',
        };
    }
    buildConversationPreview(message) {
        if (message == null) {
            return '';
        }
        if (message.messageType !== 'file' || message.file == null) {
            return message.content;
        }
        return this.buildFileSummary(message.content, message.file.name, message.file.mimeType, message.file.extension);
    }
    toPublicMessage(message) {
        return {
            id: message.id,
            conversationId: message.conversationId,
            senderName: message.senderName,
            content: message.content,
            sentAt: message.sentAt,
            messageType: message.messageType,
            file: message.file,
        };
    }
    async assertCanAccessConversation(conversation, groupId) {
        if (conversation.type === 'direct') {
            return;
        }
        if (conversation.groupId == null) {
            throw new common_1.ForbiddenException('当前群聊未绑定项目组，暂不可访问');
        }
        await this.groupsService.assertCanAccessGroup(conversation.groupId);
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
    async getUnreadCount(conversationId, userId) {
        const participant = await this.conversationParticipantRepository.findOne({
            where: { conversationId, userId, status: 'active' },
        });
        return participant?.unreadCount ?? 0;
    }
    async bumpUnreadCountForConversation(conversationId, senderUserId) {
        const participants = await this.conversationParticipantRepository.find({
            where: { conversationId, status: 'active' },
        });
        await Promise.all(participants.map(async (participant) => {
            const isSender = senderUserId != null && participant.userId === senderUserId;
            await this.conversationParticipantRepository.update({ id: participant.id }, {
                unreadCount: isSender ? 0 : participant.unreadCount + 1,
                lastReadAt: isSender ? new Date() : participant.lastReadAt,
            });
        }));
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
            await this.groupsService.assertCanAccessGroup(groupId);
        }
        const currentUser = this.authService.me();
        const myParticipations = await this.conversationParticipantRepository.findBy({ userId: currentUser.id });
        const myConversationIds = new Set(myParticipations.map((p) => p.conversationId));
        const entities = await this.conversationRepository.find({
            where: { status: 'active' },
            order: { lastMessageAt: 'DESC', createdAt: 'ASC' },
        });
        const conversations = entities.map((entity) => this.toConversationRecord(entity));
        const visibleConversations = conversations
            .filter((conversation) => {
            if (conversation.type === 'direct') {
                return myConversationIds.has(conversation.id);
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
            const [messages, unreadCount] = await Promise.all([
                this.getConversationMessages(conversation.id, conversation),
                this.getUnreadCount(conversation.id, currentUser.id),
            ]);
            return this.toPublicConversation(conversation, messages, unreadCount);
        }));
        return items;
    }
    async listMessages(conversationId) {
        this.assertAdminCannotUseChat();
        const conversation = await this.getConversationById(conversationId);
        await this.assertCanAccessConversation(conversation);
        const currentUser = this.authService.me();
        await this.ensureConversationParticipants(conversationId, [currentUser.id]);
        const now = new Date();
        await this.conversationParticipantRepository.update({ conversationId, userId: currentUser.id, status: 'active' }, {
            unreadCount: 0,
            lastReadAt: now,
        });
        if (conversation.type === 'direct') {
            await this.conversationRepository.update({ id: conversationId }, {
                lastMessageAt: now,
            });
        }
        const messages = await this.getConversationMessages(conversationId, conversation);
        return messages.map((message) => this.toPublicMessage(message));
    }
    async sendMessage(dto, file) {
        this.assertAdminCannotUseChat();
        const conversation = await this.getConversationById(dto.conversationId);
        if (conversation.type !== dto.conversationType) {
            throw new common_1.ForbiddenException('当前会话类型与发送目标不一致');
        }
        await this.assertCanAccessConversation(conversation, dto.groupId);
        const content = dto.content?.trim() ?? '';
        if (file == null && content.length === 0) {
            throw new common_1.BadRequestException('请输入消息内容后再发送');
        }
        if (file != null && conversation.type === 'agent') {
            throw new common_1.BadRequestException('当前仅支持私信和群聊发送文件');
        }
        const currentUser = this.authService.me();
        const receiverUserId = conversation.type === 'direct'
            ? (await this.getDirectConversationPeerUserId(dto.conversationId, currentUser.id)) ?? currentUser.id
            : null;
        const sentAt = new Date();
        const messageId = `msg-${Date.now()}`;
        const fileRecord = file != null ? await this.saveChatFile(conversation, messageId, file) : null;
        const messageContent = fileRecord == null ? content : (content || fileRecord.name);
        const conversationSummary = fileRecord == null
            ? messageContent
            : this.buildFileSummary(content, fileRecord.name, fileRecord.mimeType, fileRecord.extension);
        const messageEntity = this.messageRepository.create({
            id: messageId,
            conversationId: dto.conversationId,
            senderUserId: currentUser.id,
            senderAgentId: null,
            senderType: 'user',
            content: messageContent,
            messageType: fileRecord == null ? 'text' : 'file',
            metadata: {
                senderName: currentUser.name,
                readStatus: conversation.type !== 'direct',
                receiverUserId,
                file: fileRecord,
            },
            sentAt,
        });
        await this.ensureConversationParticipants(dto.conversationId, [currentUser.id, ...(receiverUserId != null ? [receiverUserId] : [])]);
        const savedMessage = await this.messageRepository.save(messageEntity);
        await this.updateConversationLastMessage(dto.conversationId, conversationSummary, sentAt);
        await this.bumpUnreadCountForConversation(dto.conversationId, currentUser.id);
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
            await this.bumpUnreadCountForConversation(dto.conversationId, null);
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
            await this.ensureConversationParticipants(saved.id, [this.authService.me().id]);
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
        await this.ensureConversationParticipants(saved.id, [this.authService.me().id]);
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
        await this.conversationParticipantRepository.delete(conversationIds.map((conversationId) => ({ conversationId })));
        await this.conversationRepository.delete(conversationIds.map((id) => ({ id })));
        for (const conversation of conversations) {
            if (conversation.conversationType === 'group') {
                this.fileStorageService.removeChatConversationFiles('group', conversation.id);
            }
        }
    }
    async syncGroupAgent(group, agent) {
        const conversation = await this.createAgentConversation(group);
        await this.conversationRepository.update({ id: conversation.id }, {
            title: agent.name,
            agentId: agent.id,
        });
        return conversation.id;
    }
    async removeDirectConversation(conversationId) {
        const conversation = await this.conversationRepository.findOneBy({
            id: conversationId,
            conversationType: 'direct',
        });
        if (!conversation) {
            return;
        }
        await this.messageRepository.delete({ conversationId });
        await this.conversationParticipantRepository.delete({ conversationId });
        await this.conversationRepository.delete({ id: conversationId });
        this.fileStorageService.removeChatConversationFiles('direct', conversationId);
    }
    async findOrCreateDirectConversation(targetUserId) {
        this.assertAdminCannotUseChat();
        const currentUser = this.authService.me();
        if (currentUser.id === targetUserId) {
            throw new common_1.BadRequestException('不能与自己发起私聊');
        }
        const myParticipations = await this.conversationParticipantRepository.findBy({ userId: currentUser.id });
        for (const p of myParticipations) {
            const conv = await this.conversationRepository.findOneBy({ id: p.conversationId, conversationType: 'direct' });
            if (!conv)
                continue;
            const peer = await this.conversationParticipantRepository.findOneBy({ conversationId: conv.id, userId: targetUserId });
            if (!peer)
                continue;
            const allParticipants = await this.conversationParticipantRepository.findBy({ conversationId: conv.id });
            if (allParticipants.length === 2)
                return this.toConversationRecord(conv);
        }
        const targetUser = this.authService.getUserById(targetUserId);
        const conv = this.conversationRepository.create({
            id: `conv-direct-${Date.now()}`,
            conversationType: 'direct',
            title: targetUser?.name ?? targetUserId,
            createdBy: currentUser.id,
        });
        const saved = await this.conversationRepository.save(conv);
        await this.ensureConversationParticipants(saved.id, [currentUser.id, targetUserId]);
        return this.toConversationRecord(saved);
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(conversation_entity_1.ConversationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(conversation_participant_entity_1.ConversationParticipantEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(message_entity_1.MessageEntity)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => groups_service_1.GroupsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService,
        file_storage_service_1.FileStorageService,
        groups_service_1.GroupsService])
], ChatService);
//# sourceMappingURL=chat.service.js.map