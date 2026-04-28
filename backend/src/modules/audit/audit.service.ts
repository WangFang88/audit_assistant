import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    await this.auditEventEntityRepository.save(this.auditEventRepository.createEntity(snapshot));
    return snapshot;
  }

  async listRecentEvents(limit = 10) {
    const entities = await this.auditEventEntityRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((entity) => this.auditEventRepository.mapEntity(entity));
  }
}
