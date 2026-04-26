import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'conversation_participants' })
export class ConversationParticipantEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id!: string;

  @Column({ name: 'conversation_id', type: 'varchar', length: 64 })
  conversationId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamp' })
  joinedAt!: Date;

  @Column({ name: 'last_read_at', type: 'timestamp', nullable: true })
  lastReadAt!: Date | null;

  @Column({ name: 'unread_count', type: 'int', default: 0 })
  unreadCount!: number;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'active' })
  status!: 'active' | 'left' | 'removed';
}
