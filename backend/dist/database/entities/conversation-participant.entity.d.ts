export declare class ConversationParticipantEntity {
    id: string;
    conversationId: string;
    userId: string;
    joinedAt: Date;
    lastReadAt: Date | null;
    unreadCount: number;
    status: 'active' | 'left' | 'removed';
}
