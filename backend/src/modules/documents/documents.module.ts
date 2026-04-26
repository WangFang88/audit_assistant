import { forwardRef, Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [forwardRef(() => GroupsModule), SubscriptionsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
