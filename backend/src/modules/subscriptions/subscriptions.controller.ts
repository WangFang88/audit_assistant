import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { AuthService } from '../auth/auth.service';
import { CreateSubscriptionOrderDto, SubscriptionsService } from './subscriptions.service';

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
    return this.subscriptionsService.getOverview(memberships.length);
  }

  @Post('orders')
  async createOrder(@Body() dto: CreateSubscriptionOrderDto) {
    return this.subscriptionsService.createSubscriptionOrder(dto);
  }
}
