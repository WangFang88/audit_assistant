import { Repository } from 'typeorm';
import { ConversationParticipantEntity } from '../../database/entities/conversation-participant.entity';
import { ConversationEntity } from '../../database/entities/conversation.entity';
import { MessageEntity } from '../../database/entities/message.entity';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { TeamAgentRecord } from '../team-agents/team-agents.service';
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
    agentId: string | null;
};
export declare class ChatService {
    private readonly conversationRepository;
    private readonly conversationParticipantRepository;
    private readonly messageRepository;
    private readonly authService;
    private readonly groupsService;
    constructor(conversationRepository: Repository<ConversationEntity>, conversationParticipantRepository: Repository<ConversationParticipantEntity>, messageRepository: Repository<MessageEntity>, authService: AuthService, groupsService: GroupsService);
    private formatDateTime;
    private assertAdminCannotUseChat;
    private buildSeedConversations;
    private buildSeedMessages;
    private buildSeedParticipants;
    private ensureConversationParticipants;
    syncGroupConversationParticipants(groupId: string, userIds: string[]): Promise<void>;
    removeUserFromGroupConversations(groupId: string, userId: string): Promise<void>;
    private ensureSeedData;
    private toConversationRecord;
    private toMessageRecord;
    private toPublicConversation;
    private toPublicMessage;
    private assertCanAccessConversation;
    private getConversationById;
    private getConversationMessages;
    private getUnreadCount;
    private bumpUnreadCountForConversation;
    private updateConversationLastMessage;
    private getDirectConversationPeerUserId;
    listConversations(groupId?: string): Promise<{
        id: string;
        type: "group" | "direct" | "agent";
        title: string;
        groupId: string | null;
        isTeamAgent: boolean;
        unreadCount: number;
        lastMessage: string;
    }[]>;
    listMessages(conversationId: string): Promise<{
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
    }[]>;
    sendMessage(dto: SendMessageDto): Promise<{
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
    }>;
    createAgentConversation(group: {
        id: string;
        name: string;
    }): Promise<ConversationRecord>;
    removeGroupConversations(groupId: string): Promise<void>;
    syncGroupAgent(group: {
        id: string;
        name: string;
    }, agent: TeamAgentRecord): Promise<string>;
}
export { SendMessageDto };
