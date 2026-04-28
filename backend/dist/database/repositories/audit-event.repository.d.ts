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
export declare class AuditEventRepository {
    createEntity(snapshot: AuditEventSnapshot): AuditEventEntity;
    mapEntity(entity: AuditEventEntity): AuditEventSnapshot;
}
