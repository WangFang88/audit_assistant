import { Repository } from 'typeorm';
import { ConversationParticipantEntity } from '../../database/entities/conversation-participant.entity';
import { ConversationEntity } from '../../database/entities/conversation.entity';
import { MessageEntity } from '../../database/entities/message.entity';
import { AuthService } from '../auth/auth.service';
import { FileStorageService } from '../documents/file-storage.service';
import { GroupsService } from '../groups/groups.service';
import { TeamAgentRecord } from '../team-agents/team-agents.service';
declare class SendMessageDto {
    conversationType: 'group' | 'direct' | 'agent';
    conversationId: string;
    content?: string;
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
export declare class ChatService {
    private readonly conversationRepository;
    private readonly conversationParticipantRepository;
    private readonly messageRepository;
    private readonly authService;
    private readonly fileStorageService;
    private readonly groupsService;
    constructor(conversationRepository: Repository<ConversationEntity>, conversationParticipantRepository: Repository<ConversationParticipantEntity>, messageRepository: Repository<MessageEntity>, authService: AuthService, fileStorageService: FileStorageService, groupsService: GroupsService);
    private formatDateTime;
    private assertAdminCannotUseChat;
    private buildSeedConversations;
    private buildSeedMessages;
    private buildSeedParticipants;
    private ensureConversationParticipants;
    syncGroupConversationParticipants(groupId: string, userIds: string[]): Promise<void>;
    removeUserFromGroupConversations(groupId: string, userId: string): Promise<void>;
    private ensureSeedData;
    private buildFileSummary;
    private getFileExtension;
    private buildFileMetadata;
    private saveChatFile;
    private toConversationRecord;
    private toMessageRecord;
    private toPublicConversation;
    private buildConversationPreview;
    private toPublicMessage;
    private assertCanAccessConversation;
    private getConversationById;
    private getConversationMessages;
    private getUnreadCount;
    private bumpUnreadCountForConversation;
    private updateConversationLastMessage;
    private refreshConversationPreview;
    private getDirectConversationPeerUserId;
    listConversations(groupId?: string): Promise<{
        id: string;
        type: "group" | "direct" | "agent";
        title: string;
        groupId: string | null;
        isTeamAgent: boolean;
        unreadCount: number;
        lastMessage: string;
        lastMessageAt: string;
    }[]>;
    listMessages(conversationId: string): Promise<{
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
        messageType: "text" | "file" | "system";
        file: MessageFileRecord | null;
    }[]>;
    sendMessage(dto: SendMessageDto, file?: Express.Multer.File): Promise<{
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
        messageType: "text" | "file" | "system";
        file: MessageFileRecord | null;
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
    clearConversationMessages(conversationId: string): Promise<{
        success: boolean;
    }>;
    removeMessage(conversationId: string, messageId: string): Promise<{
        success: boolean;
    }>;
    recallMessage(conversationId: string, messageId: string): Promise<{
        success: boolean;
    }>;
    removeDirectConversation(conversationId: string): Promise<{
        success: boolean;
    }>;
    findOrCreateDirectConversation(targetUserId: string): Promise<ConversationRecord>;
}
export { SendMessageDto };
