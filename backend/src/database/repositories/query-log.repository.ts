import { Injectable } from '@nestjs/common';
import { QueryLogEntity } from '../entities/query-log.entity';
import { formatCst } from '../../utils/date';

export type QueryLogSnapshot = {
  id: string;
  userId: string;
  teamId: string | null;
  queryText: string;
  queriedAt: string;
  consumedQuota: number;
};

@Injectable()
export class QueryLogRepository {
  createEntity(snapshot: QueryLogSnapshot): QueryLogEntity {
    const entity = new QueryLogEntity();
    entity.id = snapshot.id;
    entity.userId = snapshot.userId;
    entity.teamId = snapshot.teamId;
    entity.queryText = snapshot.queryText;
    entity.queriedAt = new Date(snapshot.queriedAt.replace(' ', 'T'));
    entity.consumedQuota = snapshot.consumedQuota;
    return entity;
  }

  mapEntity(entity: QueryLogEntity): QueryLogSnapshot {
    return {
      id: entity.id,
      userId: entity.userId,
      teamId: entity.teamId,
      queryText: entity.queryText,
      queriedAt: entity.queriedAt.toISOString().slice(0, 19).replace('T', ' '),
      consumedQuota: entity.consumedQuota,
    };
  }
}
