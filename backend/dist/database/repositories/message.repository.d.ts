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
export declare class MessageRepository {
    createGroupMessageEntity(snapshot: GroupMessageSnapshot): GroupMessageEntity;
    mapGroupMessageEntity(entity: GroupMessageEntity, extras: Pick<GroupMessageSnapshot, 'senderName' | 'conversationId'>): GroupMessageSnapshot;
    createPrivateMessageEntity(snapshot: PrivateMessageSnapshot): PrivateMessageEntity;
    mapPrivateMessageEntity(entity: PrivateMessageEntity, extras: Pick<PrivateMessageSnapshot, 'senderName' | 'conversationId'>): PrivateMessageSnapshot;
    private formatDateTime;
}
