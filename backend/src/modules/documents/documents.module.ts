import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunkEntity } from '../../database/entities/document-chunk.entity';
import { DocumentEntity } from '../../database/entities/document.entity';
import { DatabaseSupportModule } from '../../database/database-support.module';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { FileStorageService } from './file-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentChunkEntity]), DatabaseSupportModule, AuthModule, forwardRef(() => GroupsModule), SubscriptionsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, FileStorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
