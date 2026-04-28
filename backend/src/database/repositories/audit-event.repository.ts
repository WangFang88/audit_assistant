import { Injectable } from '@nestjs/common';
import { AuditEventEntity } from '../entities/audit-event.entity';

export type AuditEventSnapshot = {
  id: string;
  eventType: string;
  actorUserId: string;
  actorName: string;
  targetType: string;
  targetId: string | null;
  groupId: string | null;
  summary: string;
  status: 'success' | 'failed';
  detail: Record<string, unknown>;
  createdAt: string;
};

@Injectable()
export class AuditEventRepository {
  createEntity(snapshot: AuditEventSnapshot): AuditEventEntity {
    const entity = new AuditEventEntity();
    entity.id = snapshot.id;
    entity.eventType = snapshot.eventType;
    entity.actorUserId = snapshot.actorUserId;
    entity.actorName = snapshot.actorName;
    entity.targetType = snapshot.targetType;
    entity.targetId = snapshot.targetId;
    entity.groupId = snapshot.groupId;
    entity.summary = snapshot.summary;
    entity.status = snapshot.status;
    entity.detail = snapshot.detail;
    entity.createdAt = new Date(snapshot.createdAt.replace(' ', 'T'));
    return entity;
  }

  mapEntity(entity: AuditEventEntity): AuditEventSnapshot {
    return {
      id: entity.id,
      eventType: entity.eventType,
      actorUserId: entity.actorUserId,
      actorName: entity.actorName,
      targetType: entity.targetType,
      targetId: entity.targetId,
      groupId: entity.groupId,
      summary: entity.summary,
      status: entity.status,
      detail: entity.detail ?? {},
      createdAt: entity.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    };
  }
}
