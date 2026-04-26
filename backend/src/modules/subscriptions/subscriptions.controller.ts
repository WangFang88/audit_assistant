import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateSubscriptionOrderDto, SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('overview')
  getOverview() {
    return this.subscriptionsService.getOverview();
  }

  @Post('orders')
  createOrder(@Body() dto: CreateSubscriptionOrderDto) {
    return this.subscriptionsService.createSubscriptionOrder(dto);
  }
}
