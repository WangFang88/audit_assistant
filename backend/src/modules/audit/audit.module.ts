import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuditEventEntity } from '../../database/entities/audit-event.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEventEntity]), DatabaseSupportModule, forwardRef(() => AuthModule)],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
