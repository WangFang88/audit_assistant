import { Module } from '@nestjs/common';
import { LocalStateService } from './local-state.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [LocalStateService, SubscriptionsService],
  exports: [LocalStateService, SubscriptionsService],
})
export class SubscriptionsModule {}
