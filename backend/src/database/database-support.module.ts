import { Module } from '@nestjs/common';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { DocumentRepository } from './repositories/document.repository';
import { TeamRepository } from './repositories/team.repository';

@Module({
  providers: [AuthUserRepository, DocumentRepository, TeamRepository],
  exports: [AuthUserRepository, DocumentRepository, TeamRepository],
})
export class DatabaseSupportModule {}
