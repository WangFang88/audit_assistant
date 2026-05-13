import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { AuthService } from '../auth/auth.service';
import { BuyLibraryAccessDto, CreateSubscriptionOrderDto, SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    private readonly authService;
    private readonly teamMemberRepository;
    constructor(subscriptionsService: SubscriptionsService, authService: AuthService, teamMemberRepository: Repository<TeamMemberEntity>);
    getOverview(): Promise<{
        currentPlanId: string;
        trialEndsAt: string;
        trialDays: number;
        status: "admin-preview" | "trial" | "active" | "expired";
        statusLabel: string;
        latestOrder: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: "free" | "免费版" | "weekly" | "周订阅" | "monthly" | "月订阅" | "yearly" | "年订阅";
            amount: string;
            paidAt: string;
            expiredAt: string;
        } | null;
        effectiveOrder: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: "free" | "免费版" | "weekly" | "周订阅" | "monthly" | "月订阅" | "yearly" | "年订阅";
            amount: string;
            paidAt: string;
            expiredAt: string;
        } | null;
        orderHistory: {
            id: string;
            planType: "free" | "weekly" | "monthly" | "yearly";
            planLabel: "free" | "免费版" | "weekly" | "周订阅" | "monthly" | "月订阅" | "yearly" | "年订阅";
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
        libraryAccess: {
            id: string;
            libraryType: string;
            region: string | null;
            expiredAt: string;
        }[];
        libraryAccessPrices: Record<"local_policy" | "local_case" | "industry" | "national_case", {
            region: string;
            all: string;
        }>;
    }>;
    getQueryHistory(teamId?: string): Promise<{
        id: string;
        queryText: string;
        queryResult: any;
        queriedAt: string;
        queryScope: string | null;
    }[]>;
    createOrder(dto: CreateSubscriptionOrderDto): Promise<{
        activationMode: string;
        message: string;
    }>;
    buyLibraryAccess(dto: BuyLibraryAccessDto): Promise<{
        message: string;
    }>;
}
