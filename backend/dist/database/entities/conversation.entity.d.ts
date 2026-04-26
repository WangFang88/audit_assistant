export declare class ConversationEntity {
    id: string;
    conversationType: 'group' | 'direct' | 'agent';
    title: string;
    teamId: string | null;
    agentId: string | null;
    createdBy: string | null;
    lastMessage: string | null;
    lastMessageAt: Date | null;
    status: 'active' | 'archived' | 'deleted';
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
