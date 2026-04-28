import { ChatService, SendMessageDto } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
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
        messageType: "text" | "file" | "system";
        file: {
            name: string;
            path: string;
            size: number;
            mimeType: string;
            extension: string;
        } | null;
    }[]>;
    clearMessages(conversationId: string): Promise<{
        success: boolean;
    }>;
    removeDirectConversation(conversationId: string): Promise<{
        success: boolean;
    }>;
    sendMessage(dto: SendMessageDto, file?: Express.Multer.File): Promise<{
        id: string;
        conversationId: string;
        senderName: string;
        content: string;
        sentAt: string;
        messageType: "text" | "file" | "system";
        file: {
            name: string;
            path: string;
            size: number;
            mimeType: string;
            extension: string;
        } | null;
    }>;
    findOrCreateDirectConversation(targetUserId: string): Promise<{
        id: string;
        type: "group" | "direct" | "agent";
        title: string;
        groupId: string | null;
        agentId: string | null;
    }>;
}
