import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LocalStateService } from './local-state.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SubscriptionsController],
  providers: [LocalStateService, SubscriptionsService],
  exports: [LocalStateService, SubscriptionsService],
})
export class SubscriptionsModule {}
