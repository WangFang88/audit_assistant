import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { GroupsModule } from '../groups/groups.module';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  imports: [DocumentsModule, GroupsModule],
  controllers: [QueryController],
  providers: [QueryService],
})
export class QueryModule {}
