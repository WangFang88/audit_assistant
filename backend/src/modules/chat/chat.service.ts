import { Injectable } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

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

@Injectable()
export class ChatService {
  private readonly conversations = [
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

  private readonly messages = [
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

  listConversations(groupId?: string) {
    return this.conversations.filter((conversation) => {
      if (conversation.type === 'direct') {
        return true;
      }

      return groupId != null && conversation.groupId === groupId;
    });
  }

  listMessages(conversationId: string) {
    return this.messages.filter((message) => message.conversationId === conversationId);
  }

  sendMessage(dto: SendMessageDto) {
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
}

export { SendMessageDto };
