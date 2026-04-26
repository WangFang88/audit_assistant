import { Module } from '@nestjs/common';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { DocumentsModule } from '../documents/documents.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [DatabaseSupportModule, AuthModule, DocumentsModule, GroupsModule, SubscriptionsModule],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
