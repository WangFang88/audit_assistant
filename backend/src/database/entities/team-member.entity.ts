import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'team_members' })
export class TeamMemberEntity {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id!: number;

  @Column({ name: 'team_id', type: 'varchar', length: 64 })
  teamId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column({ name: 'role', type: 'varchar', length: 16 })
  role!: 'leader' | 'member';

  @CreateDateColumn({ name: 'joined_at', type: 'timestamp' })
  joinedAt!: Date;
}
