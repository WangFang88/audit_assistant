import { Module } from '@nestjs/common';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { QueryLogRepository } from './repositories/query-log.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TeamRepository } from './repositories/team.repository';

@Module({
  providers: [AuthUserRepository, QueryLogRepository, SubscriptionRepository, TeamRepository],
  exports: [AuthUserRepository, QueryLogRepository, SubscriptionRepository, TeamRepository],
})
export class DatabaseSupportModule {}
