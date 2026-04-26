export declare class TeamAgentEntity {
    id: string;
    teamId: string;
    name: string;
    status: 'active' | 'deleted';
    retrievalScope: string;
    capabilities: string[];
    defaultConversationId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
