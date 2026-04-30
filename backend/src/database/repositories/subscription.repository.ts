import { Injectable } from '@nestjs/common';
import { SubscriptionEntity } from '../entities/subscription.entity';
import { formatCst } from '../../utils/date';

export type SubscriptionOrderSnapshot = {
  id: string;
  userId: string;
  planType: 'free' | 'weekly' | 'monthly' | 'yearly';
  amount: string;
  paidAt: string;
  expiredAt: string;
};

@Injectable()
export class SubscriptionRepository {
  createEntity(snapshot: SubscriptionOrderSnapshot): SubscriptionEntity {
    const entity = new SubscriptionEntity();
    entity.id = snapshot.id;
    entity.userId = snapshot.userId;
    entity.planType = snapshot.planType;
    entity.amount = snapshot.amount;
    entity.paidAt = new Date(snapshot.paidAt.replace(' ', 'T'));
    entity.expiredAt = new Date(snapshot.expiredAt.replace(' ', 'T'));
    return entity;
  }

  mapEntity(entity: SubscriptionEntity): SubscriptionOrderSnapshot {
    return {
      id: entity.id,
      userId: entity.userId,
      planType: this.normalizePlanType(entity.planType),
      amount: entity.amount,
      paidAt: this.formatDateTime(entity.paidAt),
      expiredAt: this.formatDateTime(entity.expiredAt),
    };
  }

  private normalizePlanType(planType: string): SubscriptionOrderSnapshot['planType'] {
    if (planType === 'weekly' || planType === 'monthly' || planType === 'yearly') {
      return planType;
    }
    return 'free';
  }

  private formatDateTime(date: Date) {
    return formatCst(date, false);
  }
}
