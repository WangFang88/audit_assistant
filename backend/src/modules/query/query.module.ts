import { Module } from '@nestjs/common';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TeamAgentsModule } from '../team-agents/team-agents.module';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { QwenService } from './qwen.service';

@Module({
  imports: [DatabaseSupportModule, AuthModule, DocumentsModule, GroupsModule, SubscriptionsModule, TeamAgentsModule],
  controllers: [QueryController],
  providers: [QueryService, QwenService],
  exports: [QueryService],
})
export class QueryModule {}
