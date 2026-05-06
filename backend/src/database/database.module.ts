import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEventEntity } from './entities/audit-event.entity';
import { ConversationParticipantEntity } from './entities/conversation-participant.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { DocumentChunkEntity } from './entities/document-chunk.entity';
import { DocumentEntity } from './entities/document.entity';
import { DocumentExtractionJobEntity } from './entities/document-extraction-job.entity';
import { MessageEntity } from './entities/message.entity';
import { QueryLogEntity } from './entities/query-log.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { LibraryAccessEntity } from './entities/library-access.entity';
import { TeamAgentEntity } from './entities/team-agent.entity';
import { TeamMemberEntity } from './entities/team-member.entity';
import { TeamEntity } from './entities/team.entity';
import { UserEntity } from './entities/user.entity';

const entities = [
  UserEntity,
  AuditEventEntity,
  TeamEntity,
  TeamMemberEntity,
  TeamAgentEntity,
  DocumentEntity,
  DocumentChunkEntity,
  DocumentExtractionJobEntity,
  ConversationEntity,
  ConversationParticipantEntity,
  MessageEntity,
  SubscriptionEntity,
  QueryLogEntity,
  LibraryAccessEntity,
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
