import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { DocumentsModule } from '../documents/documents.module';
import { GroupsModule } from '../groups/groups.module';
import { QueryModule } from '../query/query.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TeamAgentsModule } from '../team-agents/team-agents.module';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

@Module({
  imports: [
    AuthModule,
    GroupsModule,
    DocumentsModule,
    QueryModule,
    ChatModule,
    SubscriptionsModule,
    TeamAgentsModule,
  ],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
