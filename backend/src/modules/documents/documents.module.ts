import { forwardRef, Module } from '@nestjs/common';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { FileStorageService } from './file-storage.service';

@Module({
  imports: [DatabaseSupportModule, AuthModule, forwardRef(() => GroupsModule), SubscriptionsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, FileStorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
