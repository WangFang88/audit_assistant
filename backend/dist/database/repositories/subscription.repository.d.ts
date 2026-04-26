import { SubscriptionEntity } from '../entities/subscription.entity';
export type SubscriptionOrderSnapshot = {
    id: string;
    userId: string;
    planType: 'free' | 'weekly' | 'monthly' | 'yearly';
    amount: string;
    paidAt: string;
    expiredAt: string;
};
export declare class SubscriptionRepository {
    createEntity(snapshot: SubscriptionOrderSnapshot): SubscriptionEntity;
    mapEntity(entity: SubscriptionEntity): SubscriptionOrderSnapshot;
    private normalizePlanType;
    private formatDateTime;
}
