import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  async listEvents(@Query('limit') limit?: string) {
    const resolvedLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    return this.auditService.listRecentEvents(Math.min(resolvedLimit, 50));
  }
}
