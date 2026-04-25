declare class SendMessageDto {
    conversationType: 'group' | 'direct';
    conversationId: string;
    content: string;
    groupId?: string;
}
export declare class ChatService {
    private readonly conversations;
    private readonly messages;
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
export { SendMessageDto };
