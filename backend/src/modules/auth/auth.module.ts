import { Module, forwardRef } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditModule } from '../audit/audit.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthController } from './auth.controller';
import { AuthContextInterceptor } from './auth-context.interceptor';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [DatabaseSupportModule, AuditModule, forwardRef(() => SubscriptionsModule), TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [
    AuthService,
    Reflector,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuthContextInterceptor },
  ],
  exports: [AuthService],
})
export class AuthModule {}
