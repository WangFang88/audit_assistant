import { Module } from '@nestjs/common';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { TeamRepository } from './repositories/team.repository';

@Module({
  providers: [AuthUserRepository, TeamRepository],
  exports: [AuthUserRepository, TeamRepository],
})
export class DatabaseSupportModule {}
