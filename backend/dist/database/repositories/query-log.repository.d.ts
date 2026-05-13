import { QueryLogEntity } from '../entities/query-log.entity';
export type QueryLogSnapshot = {
    id: string;
    userId: string;
    teamId: string | null;
    queryText: string;
    queryResult?: any;
    queriedAt: string;
    consumedQuota: number;
    queryScope?: string | null;
};
export declare class QueryLogRepository {
    createEntity(snapshot: QueryLogSnapshot): QueryLogEntity;
    mapEntity(entity: QueryLogEntity): QueryLogSnapshot;
}
