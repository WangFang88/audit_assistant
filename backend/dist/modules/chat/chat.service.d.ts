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
    senderName: string;
    content: string;
    sentAt: string;
};
export declare class ChatService {
    private readonly authService;
    private readonly groupsService;
    private readonly localStateService;
    constructor(authService: AuthService, groupsService: GroupsService, localStateService: LocalStateService);
    private readonly conversations;
    private readonly messages;
    private assertAdminCannotUseChat;
    private persistState;
    private assertCanAccessConversation;
    private getConversationById;
    listConversations(groupId?: string): ConversationRecord[];
    listMessages(conversationId: string): MessageRecord[];
    sendMessage(dto: SendMessageDto): {
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
        conversationType: "group" | "direct";
        groupId: string | null;
    };
}
export { SendMessageDto };
