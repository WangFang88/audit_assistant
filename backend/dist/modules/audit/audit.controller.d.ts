import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    listEvents(limit?: string): Promise<import("../../database/repositories/audit-event.repository").AuditEventSnapshot[]>;
}
