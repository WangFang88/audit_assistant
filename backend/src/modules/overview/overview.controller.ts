import { Controller, Get, Query } from '@nestjs/common';
import { OverviewService } from './overview.service';

@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('dashboard')
  async getDashboard(@Query('groupId') groupId?: string) {
    return this.overviewService.getDashboard(groupId);
  }
}
