import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GroupsModule } from './modules/groups/groups.module';
import { OverviewModule } from './modules/overview/overview.module';
import { QueryModule } from './modules/query/query.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TeamAgentsModule } from './modules/team-agents/team-agents.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    GroupsModule,
    DocumentsModule,
    QueryModule,
    ChatModule,
    SubscriptionsModule,
    TeamAgentsModule,
    OverviewModule,
  ],
})
export class AppModule {}
