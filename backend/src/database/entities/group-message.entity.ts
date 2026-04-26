import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'group_messages' })
export class GroupMessageEntity {
  @PrimaryColumn({ name: 'msg_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64 })
  teamId!: string;

  @Column({ name: 'sender_user_id', type: 'varchar', length: 64 })
  senderUserId!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamp' })
  sentAt!: Date;
}
