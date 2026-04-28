export declare class MessageEntity {
    id: string;
    conversationId: string;
    senderUserId: string | null;
    senderAgentId: string | null;
    senderType: 'user' | 'agent' | 'system';
    content: string;
    messageType: 'text' | 'file' | 'system';
    metadata: Record<string, unknown> | null;
    sentAt: Date;
}
