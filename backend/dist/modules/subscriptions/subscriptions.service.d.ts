import { QueryLogRepository, QueryLogSnapshot } from '../../database/repositories/query-log.repository';
import { SubscriptionOrderSnapshot, SubscriptionRepository } from '../../database/repositories/subscription.repository';
import { AuthService } from '../auth/auth.service';
import { LocalStateService } from './local-state.service';
declare class CreateSubscriptionOrderDto {
    planType: 'weekly' | 'monthly' | 'yearly';
}
type UsageSnapshot = {
    groups: number;
    privateDocuments: number;
    dailyQueries: number;
    dailyQueryDate: string;
};
export declare class SubscriptionsService {
    private readonly localStateService;
    private readonly queryLogRepository;
    private readonly subscriptionRepository;
    private readonly authService;
    constructor(localStateService: LocalStateService, queryLogRepository: QueryLogRepository, subscriptionRepository: SubscriptionRepository, authService: AuthService);
    private readonly currentPlanId;
    private readonly trialEndsAt;
    private readonly trialDays;
    private queryLogs;
    private subscriptionOrders;
    private usage;
    private readonly planPrices;
    private readonly planDurations;
    private readonly plans;
    private isAdmin;
    private getCurrentDateKey;
    private persistQueryLogs;
    private persistSubscriptions;
    private getUserSubscriptionOrders;
    private getLatestSubscriptionOrder;
    private formatDateTime;
    private addDays;
    private rebuildDailyUsageFromLogs;
    private ensureDailyUsageIsCurrent;
    getCurrentPlan(): {
        id: string;
        name: string;
        priceLabel: string;
        limits: {
            groupCount: number;
            privateDocuments: number;
            dailyQueries: number;
            caseSearch: boolean;
        };
    };
    getUsage(): {
        groups: number;
        privateDocuments: number;
        dailyQueries: number;
        dailyQueryDate: string;
    };
    syncUsage(usage: Partial<UsageSnapshot>): void;
    assertCanCreateGroup(currentGroupCount: number): void;
    assertCanImportPrivateDocument(currentPrivateDocumentCount: number): void;
    assertCanRunQuery(currentDailyQueries: number): void;
    recordQueryLog(queryLog: QueryLogSnapshot): void;
    syncSubscriptionOrder(order: SubscriptionOrderSnapshot): void;
    createSubscriptionOrder(dto: CreateSubscriptionOrderDto): SubscriptionOrderSnapshot;
    getOverview(): {
        currentPlanId: "free" | "weekly" | "monthly" | "yearly";
        trialEndsAt: string;
        trialDays: number;
        latestOrder: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            amount: string;
            paidAt: string;
            expiredAt: string;
        } | null;
        orderHistory: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
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
}
export { CreateSubscriptionOrderDto };
