import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getOverview(): {
        currentPlanId: string;
        trialEndsAt: string;
        trialDays: number;
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
