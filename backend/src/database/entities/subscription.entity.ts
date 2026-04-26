import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryColumn({ name: 'order_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column({ name: 'plan_type', type: 'varchar', length: 32 })
  planType!: string;

  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: 'paid_at', type: 'timestamp' })
  paidAt!: Date;

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt!: Date;
}
