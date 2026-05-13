import { Injectable } from '@nestjs/common';
import { QueryLogEntity } from '../entities/query-log.entity';
import { formatCst } from '../../utils/date';

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

@Injectable()
export class QueryLogRepository {
  createEntity(snapshot: QueryLogSnapshot): QueryLogEntity {
    const entity = new QueryLogEntity();
    entity.id = snapshot.id;
    entity.userId = snapshot.userId;
    entity.teamId = snapshot.teamId;
    entity.queryText = snapshot.queryText;
    entity.queryResult = snapshot.queryResult;
    entity.queriedAt = new Date(snapshot.queriedAt.replace(' ', 'T'));
    entity.consumedQuota = snapshot.consumedQuota;
    entity.queryScope = snapshot.queryScope ?? null;
    return entity;
  }

  mapEntity(entity: QueryLogEntity): QueryLogSnapshot {
    return {
      id: entity.id,
      userId: entity.userId,
      teamId: entity.teamId,
      queryText: entity.queryText,
      queryResult: entity.queryResult,
      queriedAt: formatCst(entity.queriedAt),
      consumedQuota: entity.consumedQuota,
      queryScope: entity.queryScope,
    };
  }
}
