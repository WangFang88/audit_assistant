import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [forwardRef(() => SubscriptionsModule)],
  controllers: [AuthController],
  providers: [
    AuthService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
