import { ChatService, SendMessageDto } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(groupId?: string): {
        id: string;
        type: "group" | "direct";
        title: string;
        groupId: string | null;
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
}
