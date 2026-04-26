import { forwardRef, Module } from '@nestjs/common';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { DocumentsModule } from '../documents/documents.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TeamAgentsModule } from '../team-agents/team-agents.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    DatabaseSupportModule,
    AuthModule,
    SubscriptionsModule,
    forwardRef(() => DocumentsModule),
    forwardRef(() => ChatModule),
    forwardRef(() => TeamAgentsModule),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
