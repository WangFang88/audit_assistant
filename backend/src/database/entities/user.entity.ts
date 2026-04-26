import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'phone', type: 'varchar', length: 32, unique: true })
  phone!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'nickname', type: 'varchar', length: 120 })
  nickname!: string;

  @CreateDateColumn({ name: 'registered_at', type: 'timestamp' })
  registeredAt!: Date;

  @Column({ name: 'subscription_type', type: 'varchar', length: 32, default: 'free' })
  subscriptionType!: string;

  @Column({ name: 'subscription_expired_at', type: 'timestamp', nullable: true })
  subscriptionExpiredAt!: Date | null;

  @Column({ name: 'role', type: 'varchar', length: 16, default: 'member' })
  role!: 'admin' | 'member';
}
