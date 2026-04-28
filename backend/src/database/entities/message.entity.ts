import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'messages' })
export class MessageEntity {
  @PrimaryColumn({ name: 'message_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'conversation_id', type: 'varchar', length: 64 })
  conversationId!: string;

  @Column({ name: 'sender_user_id', type: 'varchar', length: 64, nullable: true })
  senderUserId!: string | null;

  @Column({ name: 'sender_agent_id', type: 'varchar', length: 64, nullable: true })
  senderAgentId!: string | null;

  @Column({ name: 'sender_type', type: 'varchar', length: 16, default: 'user' })
  senderType!: 'user' | 'agent' | 'system';

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'message_type', type: 'varchar', length: 16, default: 'text' })
  messageType!: 'text' | 'file' | 'system';

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamp' })
  sentAt!: Date;
}
