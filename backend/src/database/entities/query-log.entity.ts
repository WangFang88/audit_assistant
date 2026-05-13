import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'query_logs' })
export class QueryLogEntity {
  @PrimaryColumn({ name: 'log_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64, nullable: true })
  teamId!: string | null;

  @Column({ name: 'query_text', type: 'text' })
  queryText!: string;

  @Column({ name: 'query_result', type: 'jsonb', nullable: true })
  queryResult!: any;

  @CreateDateColumn({ name: 'queried_at', type: 'timestamp' })
  queriedAt!: Date;

  @Column({ name: 'consumed_quota', type: 'int', default: 1 })
  consumedQuota!: number;

  @Column({ name: 'query_scope', type: 'varchar', length: 32, nullable: true })
  queryScope!: string | null;
}
