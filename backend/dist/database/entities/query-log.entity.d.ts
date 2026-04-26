export declare class QueryLogEntity {
    id: string;
    userId: string;
    teamId: string | null;
    queryText: string;
    queriedAt: Date;
    consumedQuota: number;
}
