import { ChatService, SendMessageDto } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(groupId?: string): Promise<{
        id: string;
        type: "group" | "agent" | "direct";
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
        readStatus: boolean;
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
    downloadMessageFile(conversationId: string, messageId: string, res: any): Promise<void>;
    removeMessage(conversationId: string, messageId: string): Promise<{
        success: boolean;
    }>;
    recallMessage(conversationId: string, messageId: string): Promise<{
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
        readStatus: boolean;
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
