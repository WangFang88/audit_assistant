import { Module } from '@nestjs/common';
import { AuditEventRepository } from './repositories/audit-event.repository';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { QueryLogRepository } from './repositories/query-log.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { TeamRepository } from './repositories/team.repository';

@Module({
  providers: [AuditEventRepository, AuthUserRepository, QueryLogRepository, SubscriptionRepository, TeamRepository],
  exports: [AuditEventRepository, AuthUserRepository, QueryLogRepository, SubscriptionRepository, TeamRepository],
})
export class DatabaseSupportModule {}
