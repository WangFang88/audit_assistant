import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'conversations' })
export class ConversationEntity {
  @PrimaryColumn({ name: 'conversation_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'conversation_type', type: 'varchar', length: 16 })
  conversationType!: 'group' | 'direct' | 'agent';

  @Column({ name: 'title', type: 'varchar', length: 160 })
  title!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64, nullable: true })
  teamId!: string | null;

  @Column({ name: 'agent_id', type: 'varchar', length: 64, nullable: true })
  agentId!: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 64, nullable: true })
  createdBy!: string | null;

  @Column({ name: 'last_message', type: 'text', nullable: true })
  lastMessage!: string | null;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'active' })
  status!: 'active' | 'archived' | 'deleted';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
