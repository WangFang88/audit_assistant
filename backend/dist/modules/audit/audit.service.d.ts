import { Repository } from 'typeorm';
import { AuditEventEntity } from '../../database/entities/audit-event.entity';
import { AuditEventRepository, AuditEventSnapshot } from '../../database/repositories/audit-event.repository';
export type CreateAuditEventInput = {
    eventType: string;
    actorUserId: string;
    actorName: string;
    targetType: string;
    targetId?: string | null;
    groupId?: string | null;
    summary: string;
    status?: 'success' | 'failed';
    detail?: Record<string, unknown>;
};
export declare class AuditService {
    private readonly auditEventEntityRepository;
    private readonly auditEventRepository;
    constructor(auditEventEntityRepository: Repository<AuditEventEntity>, auditEventRepository: AuditEventRepository);
    recordEvent(input: CreateAuditEventInput): Promise<AuditEventSnapshot>;
    listRecentEvents(limit?: number): Promise<AuditEventSnapshot[]>;
}
