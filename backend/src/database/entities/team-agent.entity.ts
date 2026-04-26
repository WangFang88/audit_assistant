import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'team_agents' })
export class TeamAgentEntity {
  @PrimaryColumn({ name: 'agent_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64, unique: true })
  teamId!: string;

  @Column({ name: 'name', type: 'varchar', length: 160 })
  name!: string;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'active' })
  status!: 'active' | 'deleted';

  @Column({ name: 'retrieval_scope', type: 'varchar', length: 64, default: 'public_plus_group_private' })
  retrievalScope!: string;

  @Column({ name: 'capabilities', type: 'jsonb', default: () => "'[]'::jsonb" })
  capabilities!: string[];

  @Column({ name: 'default_conversation_id', type: 'varchar', length: 64, nullable: true })
  defaultConversationId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
