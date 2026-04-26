import { MessageRepository } from '../../database/repositories/message.repository';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';
declare class SendMessageDto {
    conversationType: 'group' | 'direct';
    conversationId: string;
    content: string;
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
export declare class ChatService {
    private readonly authService;
    private readonly groupsService;
    private readonly localStateService;
    private readonly messageRepository;
    constructor(authService: AuthService, groupsService: GroupsService, localStateService: LocalStateService, messageRepository: MessageRepository);
    private readonly conversations;
    private readonly messages;
    private assertAdminCannotUseChat;
    private toGroupMessageSnapshot;
    private toPrivateMessageSnapshot;
    private persistState;
    private assertCanAccessConversation;
    private getConversationById;
    listConversations(groupId?: string): ConversationRecord[];
    listMessages(conversationId: string): MessageRecord[];
    sendMessage(dto: SendMessageDto): {
        id: string;
        conversationId: string;
        senderUserId: string;
        receiverUserId: string | null;
        senderName: string;
        content: string;
        sentAt: string;
        readStatus: boolean;
        conversationType: "group" | "direct";
        groupId: string | null;
    };
}
export { SendMessageDto };
