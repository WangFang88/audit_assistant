import { forwardRef, Module } from '@nestjs/common';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { DocumentsModule } from '../documents/documents.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TeamAgentsModule } from '../team-agents/team-agents.module';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { QwenService } from './qwen.service';

@Module({
  imports: [DatabaseSupportModule, AuthModule, AuditModule, DocumentsModule, forwardRef(() => GroupsModule), SubscriptionsModule, forwardRef(() => TeamAgentsModule)],
  controllers: [QueryController],
  providers: [QueryService, QwenService],
  exports: [QueryService],
})
export class QueryModule {}
