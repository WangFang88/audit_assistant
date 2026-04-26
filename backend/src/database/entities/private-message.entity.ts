import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'private_messages' })
export class PrivateMessageEntity {
  @PrimaryColumn({ name: 'msg_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'sender_user_id', type: 'varchar', length: 64 })
  senderUserId!: string;

  @Column({ name: 'receiver_user_id', type: 'varchar', length: 64 })
  receiverUserId!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamp' })
  sentAt!: Date;

  @Column({ name: 'read_status', type: 'boolean', default: false })
  readStatus!: boolean;
}
