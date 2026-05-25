import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { extname } from 'node:path';
import { Repository } from 'typeorm';
import { formatCst } from '../../utils/date';
import { ConversationParticipantEntity } from '../../database/entities/conversation-participant.entity';
import { ConversationEntity } from '../../database/entities/conversation.entity';
import { MessageEntity } from '../../database/entities/message.entity';
import { AuthService } from '../auth/auth.service';
import { FileStorageService, SavedFileRecord } from '../documents/file-storage.service';
import { GroupsService } from '../groups/groups.service';
import { QueryService } from '../query/query.service';
import { TeamAgentRecord } from '../team-agents/team-agents.service';

class SendMessageDto {
  @IsIn(['group', 'direct', 'agent'])
  conversationType!: 'group' | 'direct' | 'agent';

  @IsString()
  @MinLength(2)
  conversationId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

type ConversationRecord = {
  id: string;
  type: 'group' | 'direct' | 'agent';
  title: string;
  groupId: string | null;
  agentId: string | null;
};

type MessageFileRecord = {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  extension: string;
};

type MessageRecord = {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  senderAgentId: string | null;
  senderName: string;
  content: string;
  sentAt: string;
  readStatus: boolean;
  messageType: 'text' | 'file' | 'system';
  file: MessageFileRecord | null;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(ConversationParticipantEntity)
    private readonly conversationParticipantRepository: Repository<ConversationParticipantEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly authService: AuthService,
    private readonly fileStorageService: FileStorageService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
    private readonly queryService: QueryService,
  ) {}

  private formatDateTime(date: Date) {
    return formatCst(date, false);
  }

  private assertAdminCannotUseChat() {
    if (!this.authService.isAdmin()) {
      return;
    }

    throw new ForbiddenException('管理员不参与项目组协作，无法使用对话功能');
  }

  private buildSeedConversations() {
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

  private buildSeedMessages() {
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

  private buildSeedParticipants() {
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

  private async ensureConversationParticipants(conversationId: string, userIds: string[]) {
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
      .map((userId) =>
        this.conversationParticipantRepository.create({
          conversationId,
          userId,
          lastReadAt: null,
          unreadCount: 0,
          status: 'active',
        }),
      );

    if (missingParticipants.length > 0) {
      await this.conversationParticipantRepository.save(missingParticipants);
    }
  }

  async syncGroupConversationParticipants(groupId: string, userIds: string[]) {
    await this.ensureSeedData();
    const conversations = await this.conversationRepository.find({
      where: { teamId: groupId, status: 'active' },
    });

    await Promise.all(
      conversations.map((conversation) => this.ensureConversationParticipants(conversation.id, userIds)),
    );
  }

  async removeUserFromGroupConversations(groupId: string, userId: string) {
    await this.ensureSeedData();
    const conversations = await this.conversationRepository.find({
      where: { teamId: groupId, status: 'active' },
    });
    if (conversations.length === 0) {
      return;
    }

    await this.conversationParticipantRepository.delete(
      conversations.map((conversation) => ({
        conversationId: conversation.id,
        userId,
      })),
    );
  }

  private async ensureSeedData() {
    const conversationCount = await this.conversationRepository.count();
    if (conversationCount > 0) {
      return;
    }

    await this.conversationRepository.save(this.buildSeedConversations());
    await this.messageRepository.save(this.buildSeedMessages());
    await this.conversationParticipantRepository.save(this.buildSeedParticipants());
  }

  private buildFileSummary(content: string, fileName: string, mimeType?: string, extension?: string) {
    const normalizedMimeType = (mimeType ?? '').toLowerCase();
    const normalizedExtension = (extension ?? this.getFileExtension(fileName)).toLowerCase();
    const isImage = normalizedMimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(normalizedExtension);
    const prefix = isImage ? '[图片]' : '[文件]';
    return content.length > 0 ? `${prefix} ${content}` : `${prefix} ${fileName}`;
  }

  private getFileExtension(fileName: string) {
    const extension = extname(fileName).replace('.', '').toLowerCase();
    return extension;
  }

  private buildFileMetadata(file: Express.Multer.File, savedFile: SavedFileRecord): MessageFileRecord {
    return {
      name: savedFile.originalName,
      path: savedFile.sourcePath,
      size: file.size,
      mimeType: file.mimetype,
      extension: savedFile.extension.replace('.', '').toLowerCase() || this.getFileExtension(savedFile.originalName),
    };
  }

  private async saveChatFile(
    conversation: ConversationRecord,
    messageId: string,
    file: Express.Multer.File,
  ): Promise<MessageFileRecord> {
    const savedFile = this.fileStorageService.saveChatFile({
      file,
      conversationId: conversation.id,
      messageId,
      conversationType: conversation.type === 'group' ? 'group' : 'direct',
    });
    return this.buildFileMetadata(file, savedFile);
  }

  private toConversationRecord(entity: ConversationEntity): ConversationRecord {
    return {
      id: entity.id,
      type: entity.conversationType,
      title: entity.title,
      groupId: entity.teamId,
      agentId: entity.agentId,
    };
  }

  private toMessageRecord(entity: MessageEntity, conversation: ConversationRecord): MessageRecord {
    const metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    const senderName =
      typeof metadata.senderName === 'string'
        ? metadata.senderName
        : entity.senderType === 'agent'
          ? conversation.title
          : '未知发送者';
    const rawFile = metadata.file;
    const file =
      rawFile != null && typeof rawFile === 'object'
        ? {
            name: typeof (rawFile as Record<string, unknown>).name === 'string' ? ((rawFile as Record<string, unknown>).name as string) : '',
            path: typeof (rawFile as Record<string, unknown>).path === 'string' ? ((rawFile as Record<string, unknown>).path as string) : '',
            size: typeof (rawFile as Record<string, unknown>).size === 'number' ? ((rawFile as Record<string, unknown>).size as number) : 0,
            mimeType:
              typeof (rawFile as Record<string, unknown>).mimeType === 'string'
                ? ((rawFile as Record<string, unknown>).mimeType as string)
                : '',
            extension:
              typeof (rawFile as Record<string, unknown>).extension === 'string'
                ? ((rawFile as Record<string, unknown>).extension as string)
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

  private toPublicConversation(conversation: ConversationRecord, messages: MessageRecord[], unreadCount: number) {
    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      groupId: conversation.groupId,
      isTeamAgent: conversation.type === 'agent',
      unreadCount,
      lastMessage: this.buildConversationPreview(messages[messages.length - 1]) ?? '',
      lastMessageAt: messages.length == 0 ? '' : messages[messages.length - 1].sentAt,
    };
  }

  private buildConversationPreview(message?: MessageRecord) {
    if (message == null) {
      return '';
    }
    if (message.messageType !== 'file' || message.file == null) {
      return message.content;
    }
    return this.buildFileSummary(message.content, message.file.name, message.file.mimeType, message.file.extension);
  }

  private toPublicMessage(message: MessageRecord) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderName: message.senderName,
      content: message.content,
      sentAt: message.sentAt,
      readStatus: message.readStatus,
      messageType: message.messageType,
      file: message.file,
    };
  }

  private async assertCanAccessConversation(conversation: ConversationRecord, groupId?: string) {
    if (conversation.type === 'direct') {
      return;
    }

    if (conversation.groupId == null) {
      throw new ForbiddenException('当前群聊未绑定项目组，暂不可访问');
    }

    await this.groupsService.assertCanAccessGroup(conversation.groupId);
    if (groupId != null && conversation.groupId !== groupId) {
      throw new ForbiddenException('当前会话不属于所选项目组');
    }
  }

  private async getConversationById(conversationId: string) {
    await this.ensureSeedData();
    const entity = await this.conversationRepository.findOneBy({ id: conversationId, status: 'active' });
    if (!entity) {
      throw new NotFoundException('会话不存在');
    }

    return this.toConversationRecord(entity);
  }

  private async getConversationMessages(conversationId: string, conversation: ConversationRecord) {
    const entities = await this.messageRepository.find({
      where: { conversationId },
      order: { sentAt: 'ASC' },
    });
    return entities.map((entity) => this.toMessageRecord(entity, conversation));
  }

  private async getUnreadCount(conversationId: string, userId: string) {
    const participant = await this.conversationParticipantRepository.findOne({
      where: { conversationId, userId, status: 'active' },
    });
    return participant?.unreadCount ?? 0;
  }

  private async bumpUnreadCountForConversation(conversationId: string, senderUserId: string | null) {
    const participants = await this.conversationParticipantRepository.find({
      where: { conversationId, status: 'active' },
    });

    await Promise.all(
      participants.map(async (participant) => {
        const isSender = senderUserId != null && participant.userId === senderUserId;
        await this.conversationParticipantRepository.update(
          { id: participant.id },
          {
            unreadCount: isSender ? 0 : participant.unreadCount + 1,
            lastReadAt: isSender ? new Date() : participant.lastReadAt,
          },
        );
      }),
    );
  }

  private async updateConversationLastMessage(conversationId: string, content: string, sentAt: Date) {
    await this.conversationRepository.update(
      { id: conversationId },
      {
        lastMessage: content,
        lastMessageAt: sentAt,
      },
    );
  }

  private async refreshConversationPreview(conversation: ConversationRecord) {
    const messages = await this.getConversationMessages(conversation.id, conversation);
    const latestMessage = messages.length == 0 ? undefined : messages[messages.length - 1];
    await this.conversationRepository.update(
      { id: conversation.id },
      {
        lastMessage: latestMessage == null ? null : this.buildConversationPreview(latestMessage),
        lastMessageAt: latestMessage == null ? null : new Date(latestMessage.sentAt.replace(' ', 'T')),
      },
    );
  }

  private async getDirectConversationPeerUserId(conversationId: string, currentUserId: string) {
    const messages = await this.messageRepository.find({
      where: { conversationId, senderType: 'user' },
      order: { sentAt: 'ASC' },
    });
    const peerMessage = messages.find((message) => message.senderUserId != null && message.senderUserId !== currentUserId);
    return peerMessage?.senderUserId ?? null;
  }

  async listConversations(groupId?: string) {
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

    const items = await Promise.all(
      visibleConversations.map(async (conversation) => {
        const [messages, unreadCount] = await Promise.all([
          this.getConversationMessages(conversation.id, conversation),
          this.getUnreadCount(conversation.id, currentUser.id),
        ]);
        let resolvedConversation = conversation;
        if (conversation.type === 'direct') {
          const participants = await this.conversationParticipantRepository.findBy({ conversationId: conversation.id });
          const peerParticipant = participants.find((p) => p.userId !== currentUser.id);
          if (peerParticipant) {
            const peerUser = this.authService.getUserById(peerParticipant.userId);
            resolvedConversation = { ...conversation, title: peerUser?.name ?? peerParticipant.userId };
          }
        }
        return this.toPublicConversation(resolvedConversation, messages, unreadCount);
      }),
    );

    return items;
  }

  async listMessages(conversationId: string) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(conversationId);
    await this.assertCanAccessConversation(conversation);
    const currentUser = this.authService.me();
    await this.ensureConversationParticipants(conversationId, [currentUser.id]);
    const now = new Date();
    await this.conversationParticipantRepository.update(
      { conversationId, userId: currentUser.id, status: 'active' },
      {
        unreadCount: 0,
        lastReadAt: now,
      },
    );
    if (conversation.type === 'direct') {
      await this.conversationRepository.update(
        { id: conversationId },
        {
          lastMessageAt: now,
        },
      );
    }
    const messages = await this.getConversationMessages(conversationId, conversation);
    return messages.map((message) => this.toPublicMessage(message));
  }

  async sendMessage(dto: SendMessageDto, file?: Express.Multer.File) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(dto.conversationId);

    if (conversation.type !== dto.conversationType) {
      throw new ForbiddenException('当前会话类型与发送目标不一致');
    }

    await this.assertCanAccessConversation(conversation, dto.groupId);

    const content = dto.content?.trim() ?? '';
    if (file == null && content.length === 0) {
      throw new BadRequestException('请输入消息内容后再发送');
    }


    const currentUser = this.authService.me();
    const receiverUserId =
      conversation.type === 'direct'
        ? (await this.getDirectConversationPeerUserId(dto.conversationId, currentUser.id)) ?? currentUser.id
        : null;
    const sentAt = new Date();
    const messageId = `msg-${Date.now()}`;
    const fileRecord =
      file != null ? await this.saveChatFile(conversation, messageId, file) : null;
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
      const searchResult = await this.queryService.search(messageContent, conversation.groupId, conversation.agentId, undefined);
      await this.messageRepository.save(
        this.messageRepository.create({
          id: `msg-${Date.now() + 1}`,
          conversationId: dto.conversationId,
          senderUserId: null,
          senderAgentId: conversation.agentId,
          senderType: 'agent',
          content: searchResult.answer,
          messageType: 'text',
          metadata: {
            senderName: conversation.title,
            readStatus: true,
            searchResult: {
              citations: searchResult.citations,
              similarCases: searchResult.similarCases,
              riskTable: searchResult.riskTable,
            },
          },
          sentAt: replySentAt,
        }),
      );
      await this.bumpUnreadCountForConversation(dto.conversationId, null);
      await this.updateConversationLastMessage(
        dto.conversationId,
        searchResult.answer.substring(0, 100),
        replySentAt,
      );
    }

    return this.toPublicMessage(this.toMessageRecord(savedMessage, conversation));
  }

  async createAgentConversation(group: { id: string; name: string }) {
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

  async removeGroupConversations(groupId: string) {
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

  async syncGroupAgent(group: { id: string; name: string }, agent: TeamAgentRecord) {
    const conversation = await this.createAgentConversation(group);
    await this.conversationRepository.update(
      { id: conversation.id },
      {
        title: agent.name,
        agentId: agent.id,
      },
    );
    return conversation.id;
  }

  async clearConversationMessages(conversationId: string) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(conversationId);
    await this.assertCanAccessConversation(conversation);
    await this.messageRepository.delete({ conversationId });
    await this.conversationRepository.update(
      { id: conversationId },
      {
        lastMessage: null,
        lastMessageAt: null,
      },
    );
    const currentUser = this.authService.me();
    await this.conversationParticipantRepository.update(
      { conversationId, userId: currentUser.id, status: 'active' },
      {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    );
    if (conversation.type === 'group') {
      this.fileStorageService.removeChatConversationFiles('group', conversationId);
    }
    if (conversation.type === 'direct') {
      this.fileStorageService.removeChatConversationFiles('direct', conversationId);
    }
    return { success: true };
  }

  async downloadMessageFile(conversationId: string, messageId: string) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(conversationId);
    await this.assertCanAccessConversation(conversation);
    const message = await this.messageRepository.findOneBy({ id: messageId, conversationId });
    if (!message) {
      throw new NotFoundException('消息不存在');
    }
    const metadata = (message.metadata ?? {}) as { file?: MessageFileRecord };
    if (message.messageType !== 'file' || metadata.file?.path == null) {
      throw new BadRequestException('当前消息不包含可下载附件');
    }
    return {
      fileName: metadata.file.name,
      mimeType: metadata.file.mimeType.length === 0 ? 'application/octet-stream' : metadata.file.mimeType,
      buffer: this.fileStorageService.readStoredFile(metadata.file.path),
    };
  }

  async removeMessage(conversationId: string, messageId: string) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(conversationId);
    await this.assertCanAccessConversation(conversation);
    const message = await this.messageRepository.findOneBy({ id: messageId, conversationId });
    if (!message) {
      throw new NotFoundException('消息不存在');
    }
    const currentUser = this.authService.me();
    if (message.senderUserId !== currentUser.id) {
      throw new ForbiddenException('仅支持删除自己发送的消息');
    }
    const metadata = (message.metadata ?? {}) as { file?: MessageFileRecord };
    if (message.messageType === 'file' && metadata.file?.path) {
      this.fileStorageService.removeChatMessageFile(metadata.file.path);
    }
    await this.messageRepository.delete({ id: messageId, conversationId });
    await this.refreshConversationPreview(conversation);
    return { success: true };
  }

  async recallMessage(conversationId: string, messageId: string) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(conversationId);
    await this.assertCanAccessConversation(conversation);
    const message = await this.messageRepository.findOneBy({ id: messageId, conversationId });
    if (!message) {
      throw new NotFoundException('消息不存在');
    }
    const currentUser = this.authService.me();
    if (message.senderUserId !== currentUser.id) {
      throw new ForbiddenException('仅支持撤回自己发送的消息');
    }
    if (message.messageType === 'system') {
      throw new BadRequestException('系统消息不支持撤回');
    }
    const metadata = (message.metadata ?? {}) as { file?: MessageFileRecord; senderName?: string; readStatus?: boolean; receiverUserId?: string | null };
    if (message.messageType === 'file' && metadata.file?.path) {
      this.fileStorageService.removeChatMessageFile(metadata.file.path);
    }
    await this.messageRepository.update(
      { id: messageId, conversationId },
      {
        content: '该消息已撤回',
        messageType: 'system',
        metadata: {
          senderName: currentUser.name,
          readStatus: metadata.readStatus ?? true,
          recalledByUserId: currentUser.id,
          recalledAt: new Date().toISOString(),
          originalMessageType: message.messageType,
          ...(metadata.receiverUserId != null ? { receiverUserId: metadata.receiverUserId } : {}),
        },
      },
    );
    await this.refreshConversationPreview(conversation);
    return { success: true };
  }

  async removeDirectConversation(conversationId: string) {
    this.assertAdminCannotUseChat();
    const conversation = await this.getConversationById(conversationId);
    if (conversation.type !== 'direct') {
      throw new BadRequestException('仅支持删除私聊会话');
    }
    await this.assertCanAccessConversation(conversation);
    await this.messageRepository.delete({ conversationId });
    await this.conversationParticipantRepository.delete({ conversationId });
    await this.conversationRepository.delete({ id: conversationId });
    this.fileStorageService.removeChatConversationFiles('direct', conversationId);
    return { success: true };
  }

  async findOrCreateDirectConversation(targetUserId: string) {
    this.assertAdminCannotUseChat();
    const currentUser = this.authService.me();
    if (currentUser.id === targetUserId) {
      throw new BadRequestException('不能与自己发起私聊');
    }
    const myParticipations = await this.conversationParticipantRepository.findBy({ userId: currentUser.id });
    for (const p of myParticipations) {
      const conv = await this.conversationRepository.findOneBy({ id: p.conversationId, conversationType: 'direct' });
      if (!conv) continue;
      const peer = await this.conversationParticipantRepository.findOneBy({ conversationId: conv.id, userId: targetUserId });
      if (!peer) continue;
      const allParticipants = await this.conversationParticipantRepository.findBy({ conversationId: conv.id });
      if (allParticipants.length === 2) return this.toConversationRecord(conv);
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
}

export { SendMessageDto };
