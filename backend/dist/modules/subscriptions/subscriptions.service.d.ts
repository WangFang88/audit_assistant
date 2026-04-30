import { QueryLogRepository, QueryLogSnapshot } from '../../database/repositories/query-log.repository';
import { SubscriptionOrderSnapshot, SubscriptionRepository } from '../../database/repositories/subscription.repository';
import { AuditService } from '../audit/audit.service';
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
type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'admin-preview';
export declare class SubscriptionsService {
    private readonly localStateService;
    private readonly queryLogRepository;
    private readonly subscriptionRepository;
    private readonly authService;
    private readonly auditService;
    constructor(localStateService: LocalStateService, queryLogRepository: QueryLogRepository, subscriptionRepository: SubscriptionRepository, authService: AuthService, auditService: AuditService);
    private readonly currentPlanId;
    private readonly trialDays;
    private queryLogs;
    private subscriptionOrders;
    private usage;
    private readonly planPrices;
    private readonly planDurations;
    private readonly planRank;
    private readonly plans;
    private isAdmin;
    private getCurrentUserTrialEndsAt;
    private getCurrentDateKey;
    buildTrialEndsAt(baseDate?: Date): string;
    private persistQueryLogs;
    private persistSubscriptions;
    private getUserSubscriptionOrders;
    private getLatestSubscriptionOrder;
    private getActiveSubscriptionOrder;
    private formatDateTime;
    private addDays;
    private getCurrentPlanRank;
    private getPlanLabel;
    private isOrderActive;
    private getSubscriptionStatus;
    private getSubscriptionStatusLabel;
    private hasActiveHigherTierOrder;
    private rebuildDailyUsageFromLogs;
    private ensureDailyUsageIsCurrent;
    getCurrentPlan(): {
        readonly id: "free";
        readonly name: "免费版";
        readonly priceLabel: "¥0 / 1天试用";
        readonly activationLabel: "免费试用";
        readonly limits: {
            readonly groupCount: 1;
            readonly privateDocuments: 2;
            readonly dailyQueries: 10;
            readonly caseSearch: false;
        };
    } | {
        readonly id: "weekly";
        readonly name: "周订阅";
        readonly priceLabel: "¥70 / 周";
        readonly activationLabel: "模拟开通周订阅";
        readonly limits: {
            readonly groupCount: 5;
            readonly privateDocuments: 50;
            readonly dailyQueries: 200;
            readonly caseSearch: true;
        };
    } | {
        readonly id: "monthly";
        readonly name: "月订阅";
        readonly priceLabel: "¥200 / 月";
        readonly activationLabel: "模拟开通月订阅";
        readonly limits: {
            readonly groupCount: 20;
            readonly privateDocuments: 200;
            readonly dailyQueries: 1000;
            readonly caseSearch: true;
        };
    } | {
        readonly id: "yearly";
        readonly name: "年订阅";
        readonly priceLabel: "¥2000 / 年";
        readonly activationLabel: "模拟开通年订阅";
        readonly limits: {
            readonly groupCount: 100;
            readonly privateDocuments: 1000;
            readonly dailyQueries: 5000;
            readonly caseSearch: true;
        };
    } | {
        id: string;
        name: string;
        priceLabel: string;
        activationLabel: string;
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
    getGroupLimitForUser(userId: string): number;
    assertCanImportPrivateDocument(currentPrivateDocumentCount: number): void;
    assertCanRunQuery(currentDailyQueries: number): void;
    recordQueryLog(queryLog: QueryLogSnapshot): void;
    syncSubscriptionOrder(order: SubscriptionOrderSnapshot): void;
    createSubscriptionOrder(dto: CreateSubscriptionOrderDto): Promise<{
        activationMode: string;
        message: string;
        id: string;
        userId: string;
        planType: "free" | "weekly" | "monthly" | "yearly";
        amount: string;
        paidAt: string;
        expiredAt: string;
    }>;
    getOverview(actualGroupCount?: number, actualPrivateDocuments?: number): {
        currentPlanId: string;
        trialEndsAt: string;
        trialDays: number;
        status: SubscriptionStatus;
        statusLabel: string;
        latestOrder: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: "free" | "weekly" | "monthly" | "yearly" | "免费版" | "周订阅" | "月订阅" | "年订阅";
            amount: string;
            paidAt: string;
            expiredAt: string;
        } | null;
        effectiveOrder: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: "free" | "weekly" | "monthly" | "yearly" | "免费版" | "周订阅" | "月订阅" | "年订阅";
            amount: string;
            paidAt: string;
            expiredAt: string;
        } | null;
        orderHistory: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: "free" | "weekly" | "monthly" | "yearly" | "免费版" | "周订阅" | "月订阅" | "年订阅";
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
        plans: readonly [{
            readonly id: "free";
            readonly name: "免费版";
            readonly priceLabel: "¥0 / 1天试用";
            readonly activationLabel: "免费试用";
            readonly limits: {
                readonly groupCount: 1;
                readonly privateDocuments: 2;
                readonly dailyQueries: 10;
                readonly caseSearch: false;
            };
        }, {
            readonly id: "weekly";
            readonly name: "周订阅";
            readonly priceLabel: "¥70 / 周";
            readonly activationLabel: "模拟开通周订阅";
            readonly limits: {
                readonly groupCount: 5;
                readonly privateDocuments: 50;
                readonly dailyQueries: 200;
                readonly caseSearch: true;
            };
        }, {
            readonly id: "monthly";
            readonly name: "月订阅";
            readonly priceLabel: "¥200 / 月";
            readonly activationLabel: "模拟开通月订阅";
            readonly limits: {
                readonly groupCount: 20;
                readonly privateDocuments: 200;
                readonly dailyQueries: 1000;
                readonly caseSearch: true;
            };
        }, {
            readonly id: "yearly";
            readonly name: "年订阅";
            readonly priceLabel: "¥2000 / 年";
            readonly activationLabel: "模拟开通年订阅";
            readonly limits: {
                readonly groupCount: 100;
                readonly privateDocuments: 1000;
                readonly dailyQueries: 5000;
                readonly caseSearch: true;
            };
        }];
        pricing: {
            weekly: string;
            monthly: string;
            yearly: string;
        };
    };
}
export { CreateSubscriptionOrderDto };
