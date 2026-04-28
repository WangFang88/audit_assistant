export declare class AuditEventEntity {
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
    createdAt: Date;
}
