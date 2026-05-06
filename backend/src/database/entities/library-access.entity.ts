import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('library_access')
export class LibraryAccessEntity {
  @PrimaryColumn({ name: 'id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  // 'local_policy' | 'local_case' | 'industry'
  @Column({ name: 'library_type', type: 'varchar', length: 32 })
  libraryType!: string;

  // null = 全部地区
  @Column({ name: 'region', type: 'varchar', length: 64, nullable: true })
  region!: string | null;

  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: 'paid_at', type: 'timestamp' })
  paidAt!: Date;

  @Column({ name: 'expired_at', type: 'timestamp' })
  expiredAt!: Date;
}
