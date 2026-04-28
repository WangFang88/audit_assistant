import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { LocalStateService } from './local-state.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [DatabaseSupportModule, AuditModule, forwardRef(() => AuthModule), TypeOrmModule.forFeature([TeamMemberEntity])],
  controllers: [SubscriptionsController],
  providers: [LocalStateService, SubscriptionsService],
  exports: [LocalStateService, SubscriptionsService],
})
export class SubscriptionsModule {}
