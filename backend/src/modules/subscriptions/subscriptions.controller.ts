import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { AuthService } from '../auth/auth.service';
import { BuyLibraryAccessDto, CreateSubscriptionOrderDto, SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly authService: AuthService,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepository: Repository<TeamMemberEntity>,
  ) {}

  @Get('overview')
  async getOverview() {
    const currentUser = this.authService.me();
    const memberships = await this.teamMemberRepository.findBy({ userId: currentUser.id, role: 'leader' });
    return await this.subscriptionsService.getOverview(memberships.length);
  }

  @Get('query-history')
  async getQueryHistory(@Query('teamId') teamId?: string) {
    const currentUser = this.authService.me();
    return this.subscriptionsService.getQueryHistory(currentUser.id, teamId || null);
  }

  @Post('orders')
  async createOrder(@Body() dto: CreateSubscriptionOrderDto) {
    return this.subscriptionsService.createSubscriptionOrder(dto);
  }

  @Post('library-access')
  async buyLibraryAccess(@Body() dto: BuyLibraryAccessDto) {
    return this.subscriptionsService.buyLibraryAccess(dto);
  }
}
