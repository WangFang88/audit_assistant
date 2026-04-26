import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
  @IsIn(['group', 'direct'])
  conversationType!: 'group' | 'direct';

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
  type: 'group' | 'direct';
  title: string;
  groupId: string | null;
  unreadCount: number;
  lastMessage: string;
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
      this.conversations.splice(0, this.conversations.length, ...persistedState.conversations);
    }
    if (persistedState.messages) {
      this.messages.splice(
        0,
        this.messages.length,
        ...persistedState.messages.map((message) => ({
          ...message,
          senderUserId: 'unknown-user',
          receiverUserId: null,
          readStatus: false,
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
  ];

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

  private persistState() {
    const persistedMessages = this.messages.map((message) => {
      const conversation = this.getConversationById(message.conversationId);
      if (conversation.type === 'group') {
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
          senderName: snapshot.senderName,
          content: snapshot.content,
          sentAt: snapshot.sentAt,
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
        senderName: snapshot.senderName,
        content: snapshot.content,
        sentAt: snapshot.sentAt,
      };
    });

    this.localStateService.saveChatState(this.conversations, persistedMessages);
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

    return this.conversations.filter((conversation) => {
      if (conversation.type === 'direct') {
        return true;
      }

      return groupId != null && conversation.groupId === groupId;
    });
  }

  listMessages(conversationId: string) {
    this.assertAdminCannotUseChat();
    const conversation = this.getConversationById(conversationId);
    this.assertCanAccessConversation(conversation);
    return this.messages.filter((message) => message.conversationId === conversationId);
  }

  sendMessage(dto: SendMessageDto) {
    this.assertAdminCannotUseChat();
    const conversation = this.getConversationById(dto.conversationId);

    if (conversation.type !== dto.conversationType) {
      throw new ForbiddenException('当前会话类型与发送目标不一致');
    }

    this.assertCanAccessConversation(conversation, dto.groupId);

    const currentUser = this.authService.me();
    const directMessages = this.messages.filter((message) => message.conversationId === dto.conversationId);
    const receiverUserId =
      conversation.type === 'direct'
        ? directMessages.find((message) => message.senderUserId !== currentUser.id)?.senderUserId ?? currentUser.id
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
    conversation.lastMessage = dto.content;
    conversation.unreadCount = 0;
    this.persistState();

    return message;
  }
}

export { SendMessageDto };
