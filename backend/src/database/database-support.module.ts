import { Module } from '@nestjs/common';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { DocumentRepository } from './repositories/document.repository';
import { QueryLogRepository } from './repositories/query-log.repository';
import { TeamRepository } from './repositories/team.repository';

@Module({
  providers: [AuthUserRepository, DocumentRepository, QueryLogRepository, TeamRepository],
  exports: [AuthUserRepository, DocumentRepository, QueryLogRepository, TeamRepository],
})
export class DatabaseSupportModule {}
