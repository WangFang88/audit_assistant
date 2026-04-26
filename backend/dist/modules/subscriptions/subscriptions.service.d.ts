import { AuthService } from '../auth/auth.service';
import { LocalStateService } from './local-state.service';
type UsageSnapshot = {
    groups: number;
    privateDocuments: number;
    dailyQueries: number;
    dailyQueryDate: string;
};
export declare class SubscriptionsService {
    private readonly localStateService;
    private readonly authService;
    constructor(localStateService: LocalStateService, authService: AuthService);
    private readonly currentPlanId;
    private readonly trialEndsAt;
    private readonly trialDays;
    private usage;
    private readonly plans;
    private isAdmin;
    private getCurrentDateKey;
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
    consumeQuery(): void;
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
export {};
