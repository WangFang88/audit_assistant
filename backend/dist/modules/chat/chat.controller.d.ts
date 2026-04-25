import { ChatService, SendMessageDto } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listConversations(): ({
        id: string;
        type: string;
        title: string;
        groupId: string;
        unreadCount: number;
        lastMessage: string;
    } | {
        id: string;
        type: string;
        title: string;
        groupId: null;
        unreadCount: number;
        lastMessage: string;
    })[];
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
        conversationType: "group" | "direct";
        groupId: string | null;
    };
}
