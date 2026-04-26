import { Injectable } from '@nestjs/common';
import { GroupMessageEntity } from '../entities/group-message.entity';
import { PrivateMessageEntity } from '../entities/private-message.entity';

export type GroupMessageSnapshot = {
  id: string;
  teamId: string;
  senderUserId: string;
  senderName: string;
  conversationId: string;
  content: string;
  sentAt: string;
};

export type PrivateMessageSnapshot = {
  id: string;
  senderUserId: string;
  receiverUserId: string;
  senderName: string;
  conversationId: string;
  content: string;
  sentAt: string;
  readStatus: boolean;
};

@Injectable()
export class MessageRepository {
  createGroupMessageEntity(snapshot: GroupMessageSnapshot): GroupMessageEntity {
    const entity = new GroupMessageEntity();
    entity.id = snapshot.id;
    entity.teamId = snapshot.teamId;
    entity.senderUserId = snapshot.senderUserId;
    entity.content = snapshot.content;
    entity.sentAt = new Date(snapshot.sentAt.replace(' ', 'T'));
    return entity;
  }

  mapGroupMessageEntity(entity: GroupMessageEntity, extras: Pick<GroupMessageSnapshot, 'senderName' | 'conversationId'>): GroupMessageSnapshot {
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

  createPrivateMessageEntity(snapshot: PrivateMessageSnapshot): PrivateMessageEntity {
    const entity = new PrivateMessageEntity();
    entity.id = snapshot.id;
    entity.senderUserId = snapshot.senderUserId;
    entity.receiverUserId = snapshot.receiverUserId;
    entity.content = snapshot.content;
    entity.sentAt = new Date(snapshot.sentAt.replace(' ', 'T'));
    entity.readStatus = snapshot.readStatus;
    return entity;
  }

  mapPrivateMessageEntity(
    entity: PrivateMessageEntity,
    extras: Pick<PrivateMessageSnapshot, 'senderName' | 'conversationId'>,
  ): PrivateMessageSnapshot {
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

  private formatDateTime(date: Date) {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}
