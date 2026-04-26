import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'teams' })
export class TeamEntity {
  @PrimaryColumn({ name: 'team_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'owner_user_id', type: 'varchar', length: 64 })
  ownerUserId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'organization_name', type: 'varchar', length: 160 })
  organizationName!: string;

  @Column({ name: 'last_query_at', type: 'timestamp', nullable: true })
  lastQueryAt!: Date | null;
}
