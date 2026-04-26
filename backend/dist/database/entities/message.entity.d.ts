export declare class MessageEntity {
    id: string;
    conversationId: string;
    senderUserId: string | null;
    senderAgentId: string | null;
    senderType: 'user' | 'agent' | 'system';
    content: string;
    messageType: 'text' | 'system';
    metadata: Record<string, unknown> | null;
    sentAt: Date;
}
