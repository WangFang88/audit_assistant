import { TeamAgentRecord } from '../team-agents/team-agents.service';
import { MessageRepository } from '../../database/repositories/message.repository';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';
declare class SendMessageDto {
    conversationType: 'group' | 'direct' | 'agent';
    conversationId: string;
    content: string;
    groupId?: string;
}
type ConversationRecord = {
    id: string;
    type: 'group' | 'direct' | 'agent';
    title: string;
    groupId: string | null;
};
export declare class ChatService {
    private readonly authService;
    private readonly groupsService;
    private readonly localStateService;
    private readonly messageRepository;
    constructor(authService: AuthService, groupsService: GroupsService, localStateService: LocalStateService, messageRepository: MessageRepository);
    private readonly conversations;
    private readonly messages;
    private resolveLegacySenderUserId;
    private resolveLegacyReceiverUserId;
    private assertAdminCannotUseChat;
    private toGroupMessageSnapshot;
    private toPrivateMessageSnapshot;
    private getDirectConversationPeerUserId;
    private getConversationUnreadCount;
    private getConversationLastMessage;
    private toPublicConversation;
    private toPublicMessage;
    private persistState;
    private assertCanAccessConversation;
    private getConversationById;
    listConversations(groupId?: string): {
        id: string;
        type: "group" | "direct" | "agent";
        title: string;
        groupId: string | null;
        isTeamAgent: boolean;
        unreadCount: number;
        lastMessage: string;
    }[];
    listMessages(conversationId: string): {
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
    }[];
    sendMessage(dto: SendMessageDto): {
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
    };
    createAgentConversation(group: {
        id: string;
        name: string;
    }): ConversationRecord;
    removeGroupConversations(groupId: string): void;
    syncGroupAgent(group: {
        id: string;
        name: string;
    }, agent: TeamAgentRecord): string;
}
export { SendMessageDto };
