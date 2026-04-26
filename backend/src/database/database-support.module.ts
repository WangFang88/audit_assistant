import { Module } from '@nestjs/common';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { DocumentRepository } from './repositories/document.repository';
import { MessageRepository } from './repositories/message.repository';
import { QueryLogRepository } from './repositories/query-log.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TeamRepository } from './repositories/team.repository';

@Module({
  providers: [AuthUserRepository, DocumentRepository, MessageRepository, QueryLogRepository, SubscriptionRepository, TeamRepository],
  exports: [AuthUserRepository, DocumentRepository, MessageRepository, QueryLogRepository, SubscriptionRepository, TeamRepository],
})
export class DatabaseSupportModule {}
