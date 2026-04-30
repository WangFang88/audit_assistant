import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEventEntity } from '../../database/entities/audit-event.entity';
import { AuditEventRepository, AuditEventSnapshot } from '../../database/repositories/audit-event.repository';
import { formatCst } from '../../utils/date';

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

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly auditEventEntityRepository: Repository<AuditEventEntity>,
    private readonly auditEventRepository: AuditEventRepository,
  ) {}

  async recordEvent(input: CreateAuditEventInput) {
    const snapshot: AuditEventSnapshot = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      eventType: input.eventType,
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      groupId: input.groupId ?? null,
      summary: input.summary,
      status: input.status ?? 'success',
      detail: input.detail ?? {},
      createdAt: formatCst(new Date()),
    };
    await this.auditEventEntityRepository.save(this.auditEventRepository.createEntity(snapshot));
    return snapshot;
  }

  async listRecentEvents(limit = 10, filter?: { isAdmin?: boolean; userId?: string; groupIds?: string[] }) {
    const qb = this.auditEventEntityRepository.createQueryBuilder('e').orderBy('e.createdAt', 'DESC').take(limit);

    if (filter && !filter.isAdmin) {
      if (filter.groupIds && filter.groupIds.length > 0) {
        qb.where('(e.actorUserId = :userId OR e.groupId IN (:...groupIds))', {
          userId: filter.userId,
          groupIds: filter.groupIds,
        });
      } else {
        qb.where('e.actorUserId = :userId', { userId: filter.userId });
      }
    }

    const entities = await qb.getMany();
    return entities.map((entity) => this.auditEventRepository.mapEntity(entity));
  }
}
