import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { GroupsModule } from './modules/groups/groups.module';
import { QueryModule } from './modules/query/query.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    AuthModule,
    GroupsModule,
    DocumentsModule,
    QueryModule,
    ChatModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
