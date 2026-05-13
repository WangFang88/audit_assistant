export declare class QueryLogEntity {
    id: string;
    userId: string;
    teamId: string | null;
    queryText: string;
    queryResult: any;
    queriedAt: Date;
    consumedQuota: number;
    queryScope: string | null;
}
