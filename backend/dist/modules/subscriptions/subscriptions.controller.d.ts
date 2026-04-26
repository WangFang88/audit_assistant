import { CreateSubscriptionOrderDto, SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getOverview(): {
        currentPlanId: "free" | "weekly" | "monthly" | "yearly";
        trialEndsAt: string;
        trialDays: number;
        status: "trial" | "active" | "expired" | "admin-preview";
        statusLabel: string;
        latestOrder: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: string;
            amount: string;
            paidAt: string;
            expiredAt: string;
        } | null;
        orderHistory: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: string;
            amount: string;
            paidAt: string;
            expiredAt: string;
        }[];
        usage: {
            groups: {
                used: number;
                limit: number;
            };
            privateDocuments: {
                used: number;
                limit: number;
            };
            dailyQueries: {
                used: number;
                limit: number;
            };
        };
        limits: {
            maxGroups: number;
            maxPrivateDocuments: number;
            dailyQueryLimit: number;
            caseSearchEnabled: boolean;
            riskTablePreviewLimit: number;
        };
        planHighlights: string[];
        plans: {
            id: string;
            name: string;
            priceLabel: string;
            limits: {
                groupCount: number;
                privateDocuments: number;
                dailyQueries: number;
                caseSearch: boolean;
            };
        }[];
        pricing: {
            weekly: string;
            monthly: string;
            yearly: string;
        };
    };
    createOrder(dto: CreateSubscriptionOrderDto): import("../../database/repositories/subscription.repository").SubscriptionOrderSnapshot;
}
