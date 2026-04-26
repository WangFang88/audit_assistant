import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TeamAgentsService } from './team-agents.service';

@Module({
  imports: [AuthModule, forwardRef(() => GroupsModule), SubscriptionsModule],
  providers: [TeamAgentsService],
  exports: [TeamAgentsService],
})
export class TeamAgentsModule {}
