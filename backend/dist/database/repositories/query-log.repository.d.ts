import { QueryLogEntity } from '../entities/query-log.entity';
export type QueryLogSnapshot = {
    id: string;
    userId: string;
    teamId: string | null;
    queryText: string;
    queriedAt: string;
    consumedQuota: number;
};
export declare class QueryLogRepository {
    createEntity(snapshot: QueryLogSnapshot): QueryLogEntity;
    mapEntity(entity: QueryLogEntity): QueryLogSnapshot;
}
