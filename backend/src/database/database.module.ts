import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMessageEntity } from './entities/group-message.entity';
import { PrivateDocEntity } from './entities/private-doc.entity';
import { PrivateMessageEntity } from './entities/private-message.entity';
import { PublicDocEntity } from './entities/public-doc.entity';
import { QueryLogEntity } from './entities/query-log.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { TeamMemberEntity } from './entities/team-member.entity';
import { TeamEntity } from './entities/team.entity';
import { UserEntity } from './entities/user.entity';

const entities = [
  UserEntity,
  TeamEntity,
  TeamMemberEntity,
  PublicDocEntity,
  PrivateDocEntity,
  GroupMessageEntity,
  PrivateMessageEntity,
  SubscriptionEntity,
  QueryLogEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'audit_assistant',
      entities,
      synchronize: process.env.DB_SYNC === 'true',
      autoLoadEntities: false,
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
