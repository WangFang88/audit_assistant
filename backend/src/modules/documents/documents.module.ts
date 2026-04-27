import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunkEntity } from '../../database/entities/document-chunk.entity';
import { DocumentEntity } from '../../database/entities/document.entity';
import { DocumentExtractionJobEntity } from '../../database/entities/document-extraction-job.entity';
import { AuthModule } from '../auth/auth.module';
import { GroupsModule } from '../groups/groups.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { FileStorageService } from './file-storage.service';
import { TextExtractionService } from './text-extraction.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentEntity, DocumentChunkEntity, DocumentExtractionJobEntity]), AuthModule, forwardRef(() => GroupsModule), SubscriptionsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, FileStorageService, TextExtractionService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
