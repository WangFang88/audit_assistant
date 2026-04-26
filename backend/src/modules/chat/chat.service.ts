import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TeamAgentRecord } from '../team-agents/team-agents.service';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  GroupMessageSnapshot,
  MessageRepository,
  PrivateMessageSnapshot,
} from '../../database/repositories/message.repository';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';

class SendMessageDto {
  @IsIn(['group', 'direct', 'agent'])
  conversationType!: 'group' | 'direct' | 'agent';

  @IsString()
  @MinLength(2)
  conversationId!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

type ConversationRecord = {
  id: string;
  type: 'group' | 'direct' | 'agent';
  title: string;
  groupId: string | null;
};

type MessageRecord = {
  id: string;
  conversationId: string;
  senderUserId: string;
  receiverUserId: string | null;
  senderName: string;
  content: string;
  sentAt: string;
  readStatus: boolean;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly authService: AuthService,
    private readonly groupsService: GroupsService,
    private readonly localStateService: LocalStateService,
    private readonly messageRepository: MessageRepository,
  ) {
    const persistedState = this.localStateService.readState();
    if (persistedState.conversations) {
      this.conversations.splice(
        0,
        this.conversations.length,
        ...persistedState.conversations.map((conversation) => ({
          id: conversation.id,
          type: conversation.type,
          title: conversation.title,
          groupId: conversation.groupId,
        })),
      );
    }
    if (persistedState.messages) {
      this.messages.splice(
        0,
        this.messages.length,
        ...persistedState.messages.map((message) => ({
          id: message.id,
          conversationId: message.conversationId,
          senderUserId: message.senderUserId ?? this.resolveLegacySenderUserId(message.senderName),
          receiverUserId: message.receiverUserId ?? this.resolveLegacyReceiverUserId(message.conversationId, message.senderName),
          senderName: message.senderName,
          content: message.content,
          sentAt: message.sentAt,
          readStatus: message.readStatus ?? false,
        })),
      );
    }
  }

  private readonly conversations: ConversationRecord[] = [
    {
      id: 'conv-group-1',
      type: 'group',
      title: '某区财政局审计组群聊',
      groupId: 'group-1',
    },
    {
      id: 'conv-agent-1',
      type: 'agent',
      title: '某区财政局审计组 Agent',
      groupId: 'group-1',
    },
    {
      id: 'conv-direct-1',
      type: 'direct',
      title: '与法规顾问的私信',
      groupId: null,
    },
  ];

  private readonly messages: MessageRecord[] = [
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
    {
      id: 'msg-3',
      conversationId: 'conv-agent-1',
      senderUserId: 'user-2',
      receiverUserId: null,
      senderName: '审计组长',
      content: '请结合当前项目私有制度，解释采购审批与专项资金使用的核查重点。',
      sentAt: '2026-04-25 16:55',
      readStatus: true,
    },
  ];

  private resolveLegacySenderUserId(senderName: string) {
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

  private resolveLegacyReceiverUserId(conversationId: string, senderName: string) {
    const conversation = this.conversations.find((item) => item.id === conversationId);
    if (conversation?.type !== 'direct') {
      return null;
    }

    const senderUserId = this.resolveLegacySenderUserId(senderName);
    const currentUserId = this.authService.me().id;
    return senderUserId === currentUserId ? null : currentUserId;
  }

  private assertAdminCannotUseChat() {
    if (!this.authService.isAdmin()) {
      return;
    }

    throw new ForbiddenException('管理员不参与项目组协作，无法使用对话功能');
  }

  private toGroupMessageSnapshot(message: MessageRecord, groupId: string): GroupMessageSnapshot {
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

  private toPrivateMessageSnapshot(message: MessageRecord): PrivateMessageSnapshot {
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

  private getDirectConversationPeerUserId(conversationId: string, currentUserId: string) {
    const peerMessage = this.messages.find(
      (message) => message.conversationId === conversationId && message.senderUserId !== currentUserId,
    );
    return peerMessage?.senderUserId ?? null;
  }

  private getConversationUnreadCount(conversationId: string) {
    return this.messages.filter((message) => message.conversationId === conversationId && !message.readStatus).length;
  }

  private getConversationLastMessage(conversationId: string) {
    const conversationMessages = this.messages.filter((message) => message.conversationId === conversationId);
    return conversationMessages[conversationMessages.length - 1]?.content ?? '';
  }

  private toPublicConversation(conversation: ConversationRecord) {
    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      groupId: conversation.groupId,
      isTeamAgent: conversation.type === 'agent',
      unreadCount: this.getConversationUnreadCount(conversation.id),
      lastMessage: this.getConversationLastMessage(conversation.id),
    };
  }

  private toPublicMessage(message: MessageRecord) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderName: message.senderName,
      content: message.content,
      sentAt: message.sentAt,
    };
  }

  private persistState() {
    const persistedMessages = this.messages.map((message) => {
      const conversation = this.getConversationById(message.conversationId);
      if (conversation.type === 'group' || conversation.type === 'agent') {
        const entity = this.messageRepository.createGroupMessageEntity(
          this.toGroupMessageSnapshot(message, conversation.groupId ?? 'unknown-group'),
        );
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

    this.localStateService.saveChatState(
      this.conversations.map((conversation) => ({
        id: conversation.id,
        type: conversation.type,
        title: conversation.title,
        groupId: conversation.groupId,
      })),
      persistedMessages,
    );
  }

  private assertCanAccessConversation(conversation: ConversationRecord, groupId?: string) {
    if (conversation.type === 'direct') {
      return;
    }

    if (conversation.groupId == null) {
      throw new ForbiddenException('当前群聊未绑定项目组，暂不可访问');
    }

    this.groupsService.assertCanAccessGroup(conversation.groupId);
    if (groupId != null && conversation.groupId !== groupId) {
      throw new ForbiddenException('当前会话不属于所选项目组');
    }
  }

  private getConversationById(conversationId: string) {
    const conversation = this.conversations.find((item) => item.id === conversationId);
    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }

    return conversation;
  }

  listConversations(groupId?: string) {
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
      .sort((a, b) => {
        if (a.type === 'agent' && b.type !== 'agent') {
          return -1;
        }
        if (a.type !== 'agent' && b.type === 'agent') {
          return 1;
        }
        return 0;
      })
      .map((conversation) => this.toPublicConversation(conversation));
  }

  listMessages(conversationId: string) {
    this.assertAdminCannotUseChat();
    const conversation = this.getConversationById(conversationId);
    this.assertCanAccessConversation(conversation);
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .map((message) => this.toPublicMessage(message));
  }

  sendMessage(dto: SendMessageDto) {
    this.assertAdminCannotUseChat();
    const conversation = this.getConversationById(dto.conversationId);

    if (conversation.type !== dto.conversationType) {
      throw new ForbiddenException('当前会话类型与发送目标不一致');
    }

    this.assertCanAccessConversation(conversation, dto.groupId);

    const currentUser = this.authService.me();
    const receiverUserId =
      conversation.type === 'direct'
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
      readStatus: conversation.type !== 'direct',
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

    if (conversation.type === 'agent') {
      this.messages.push({
        id: `msg-${this.messages.length + 1}`,
        conversationId: message.conversationId,
        senderUserId: 'team-agent',
        receiverUserId: currentUser.id,
        senderName: conversation.title,
        content: '已收到本次提问。当前项目组 Agent 将在公共库与本组私有库范围内完成检索，并返回可溯源依据。',
        sentAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        readStatus: true,
      });
    }

    this.persistState();

    return this.toPublicMessage(message);
  }

  createAgentConversation(group: { id: string; name: string }) {
    const existing = this.conversations.find((conversation) => conversation.type === 'agent' && conversation.groupId === group.id);
    if (existing) {
      existing.title = `${group.name} Agent`;
      this.persistState();
      return existing;
    }

    const conversation: ConversationRecord = {
      id: `conv-agent-${group.id}`,
      type: 'agent',
      title: `${group.name} Agent`,
      groupId: group.id,
    };
    this.conversations.push(conversation);
    this.persistState();
    return conversation;
  }

  removeGroupConversations(groupId: string) {
    const removedConversationIds = new Set(
      this.conversations.filter((conversation) => conversation.groupId === groupId).map((conversation) => conversation.id),
    );
    this.conversations.splice(
      0,
      this.conversations.length,
      ...this.conversations.filter((conversation) => !removedConversationIds.has(conversation.id)),
    );
    this.messages.splice(
      0,
      this.messages.length,
      ...this.messages.filter((message) => !removedConversationIds.has(message.conversationId)),
    );
    this.persistState();
  }

  syncGroupAgent(group: { id: string; name: string }, agent: TeamAgentRecord) {
    const conversation = this.createAgentConversation(group);
    if (agent.defaultConversationId !== conversation.id) {
      agent.defaultConversationId = conversation.id;
    }
    return conversation.id;
  }
}

export { SendMessageDto };
