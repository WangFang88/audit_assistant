import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DocumentsService, ImportDocumentDto } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  listDocuments(@Query('groupId') groupId?: string) {
    return this.documentsService.listDocuments(groupId);
  }

  @Get('extract-jobs')
  listExtractionJobs(@Query('groupId') groupId?: string) {
    return this.documentsService.listExtractionJobs(groupId);
  }

  @Get(':documentId/chunks')
  listDocumentChunks(@Param('documentId') documentId: string) {
    return this.documentsService.listDocumentChunks(documentId);
  }

  @Post('import-from-file-server')
  importDocument(@Body() dto: ImportDocumentDto) {
    return this.documentsService.importDocument(dto);
  }
}
