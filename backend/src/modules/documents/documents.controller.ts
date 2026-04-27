import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService, ImportDocumentDto } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async listDocuments(@Query('groupId') groupId?: string) {
    return this.documentsService.listDocuments(groupId);
  }

  @Get('extract-jobs')
  async listExtractionJobs(@Query('groupId') groupId?: string) {
    return this.documentsService.listExtractionJobs(groupId);
  }

  @Get(':documentId/chunks')
  async listDocumentChunks(@Param('documentId') documentId: string) {
    return this.documentsService.listDocumentChunks(documentId);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importDocument(@UploadedFile() file: Express.Multer.File | undefined, @Body() dto: ImportDocumentDto) {
    return this.documentsService.importDocument(dto, file);
  }
}
