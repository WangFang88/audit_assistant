import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'audit_events' })
export class AuditEventEntity {
  @PrimaryColumn({ name: 'event_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType!: string;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 64 })
  actorUserId!: string;

  @Column({ name: 'actor_name', type: 'varchar', length: 120 })
  actorName!: string;

  @Column({ name: 'target_type', type: 'varchar', length: 64 })
  targetType!: string;

  @Column({ name: 'target_id', type: 'varchar', length: 64, nullable: true })
  targetId!: string | null;

  @Column({ name: 'group_id', type: 'varchar', length: 64, nullable: true })
  groupId!: string | null;

  @Column({ name: 'summary', type: 'varchar', length: 255 })
  summary!: string;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'success' })
  status!: 'success' | 'failed';

  @Column({ name: 'detail', type: 'jsonb', default: () => "'{}'" })
  detail!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
