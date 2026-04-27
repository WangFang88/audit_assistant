"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSubscriptionOrderDto = exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const query_log_repository_1 = require("../../database/repositories/query-log.repository");
const subscription_repository_1 = require("../../database/repositories/subscription.repository");
const auth_service_1 = require("../auth/auth.service");
const local_state_service_1 = require("./local-state.service");
class CreateSubscriptionOrderDto {
}
exports.CreateSubscriptionOrderDto = CreateSubscriptionOrderDto;
__decorate([
    (0, class_validator_1.IsIn)(['weekly', 'monthly', 'yearly']),
    __metadata("design:type", String)
], CreateSubscriptionOrderDto.prototype, "planType", void 0);
let SubscriptionsService = class SubscriptionsService {
    constructor(localStateService, queryLogRepository, subscriptionRepository, authService) {
        this.localStateService = localStateService;
        this.queryLogRepository = queryLogRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.authService = authService;
        this.currentPlanId = 'free';
        this.trialEndsAt = '2026-05-01';
        this.trialDays = 1;
        this.queryLogs = [];
        this.subscriptionOrders = [
            {
                id: 'order-free-1',
                userId: 'user-2',
                planType: 'free',
                amount: '0.00',
                paidAt: '2026-04-25 09:00',
                expiredAt: '2026-05-01 00:00',
            },
        ];
        this.usage = {
            groups: 1,
            privateDocuments: 0,
            dailyQueries: 0,
            dailyQueryDate: this.getCurrentDateKey(),
        };
        this.planPrices = {
            weekly: '70.00',
            monthly: '200.00',
            yearly: '2000.00',
        };
        this.planDurations = {
            weekly: 7,
            monthly: 30,
            yearly: 365,
        };
        this.planRank = {
            free: 0,
            weekly: 1,
            monthly: 2,
            yearly: 3,
        };
        this.plans = [
            {
                id: 'free',
                name: '免费版',
                priceLabel: '¥0 / 1天试用',
                limits: {
                    groupCount: 1,
                    privateDocuments: 20,
                    dailyQueries: 10,
                    caseSearch: false,
                },
            },
            {
                id: 'weekly',
                name: '周订阅',
                priceLabel: '¥70 / 周',
                limits: {
                    groupCount: 5,
                    privateDocuments: 50,
                    dailyQueries: 200,
                    caseSearch: true,
                },
            },
            {
                id: 'monthly',
                name: '月订阅',
                priceLabel: '¥200 / 月',
                limits: {
                    groupCount: 20,
                    privateDocuments: 200,
                    dailyQueries: 1000,
                    caseSearch: true,
                },
            },
            {
                id: 'yearly',
                name: '年订阅',
                priceLabel: '¥2000 / 年',
                limits: {
                    groupCount: 100,
                    privateDocuments: 1000,
                    dailyQueries: 5000,
                    caseSearch: true,
                },
            },
        ];
        const persistedState = this.localStateService.readState();
        if (persistedState.usage) {
            this.usage = {
                ...this.usage,
                ...persistedState.usage,
            };
        }
        if (persistedState.queryLogs) {
            this.queryLogs = persistedState.queryLogs.map((queryLog) => {
                const entity = this.queryLogRepository.createEntity(queryLog);
                return this.queryLogRepository.mapEntity(entity);
            });
        }
        if (persistedState.subscriptions) {
            this.subscriptionOrders = persistedState.subscriptions.map((subscription) => {
                const entity = this.subscriptionRepository.createEntity(subscription);
                return this.subscriptionRepository.mapEntity(entity);
            });
        }
        this.ensureDailyUsageIsCurrent();
    }
    isAdmin() {
        return this.authService.me().role === 'admin';
    }
    getCurrentDateKey() {
        return new Date().toISOString().slice(0, 10);
    }
    persistQueryLogs() {
        this.localStateService.saveQueryLogs(this.queryLogs);
    }
    persistSubscriptions() {
        this.localStateService.saveSubscriptions(this.subscriptionOrders);
    }
    getUserSubscriptionOrders() {
        const currentUserId = this.authService.me().id;
        return this.subscriptionOrders.filter((order) => order.userId === currentUserId);
    }
    getLatestSubscriptionOrder() {
        const userOrders = this.getUserSubscriptionOrders();
        return userOrders[userOrders.length - 1] ?? null;
    }
    formatDateTime(date) {
        return date.toISOString().slice(0, 16).replace('T', ' ');
    }
    addDays(baseDate, days) {
        const nextDate = new Date(baseDate.getTime());
        nextDate.setUTCDate(nextDate.getUTCDate() + days);
        return nextDate;
    }
    getCurrentPlanRank(planType) {
        return this.planRank[planType];
    }
    getPlanLabel(planType) {
        return this.plans.find((plan) => plan.id === planType)?.name ?? planType;
    }
    isOrderActive(order) {
        return new Date(order.expiredAt.replace(' ', 'T')).getTime() > Date.now();
    }
    getSubscriptionStatus() {
        if (this.isAdmin()) {
            return 'admin-preview';
        }
        const latestOrder = this.getLatestSubscriptionOrder();
        if (latestOrder) {
            return this.isOrderActive(latestOrder) ? 'active' : 'expired';
        }
        return 'trial';
    }
    getSubscriptionStatusLabel(status) {
        switch (status) {
            case 'trial':
                return '试用中';
            case 'active':
                return '生效中';
            case 'expired':
                return '已过期';
            case 'admin-preview':
                return '管理员预览';
        }
    }
    hasActiveHigherTierOrder(planType) {
        const latestOrder = this.getLatestSubscriptionOrder();
        if (!latestOrder) {
            return false;
        }
        if (!this.isOrderActive(latestOrder)) {
            return false;
        }
        return this.getCurrentPlanRank(latestOrder.planType) > this.getCurrentPlanRank(planType);
    }
    rebuildDailyUsageFromLogs() {
        const currentDateKey = this.getCurrentDateKey();
        const dailyQueries = this.queryLogs
            .filter((queryLog) => queryLog.queriedAt.slice(0, 10) === currentDateKey)
            .reduce((total, queryLog) => total + queryLog.consumedQuota, 0);
        this.usage = {
            ...this.usage,
            dailyQueries,
            dailyQueryDate: currentDateKey,
        };
        this.localStateService.saveUsage(this.usage);
    }
    ensureDailyUsageIsCurrent() {
        const currentDateKey = this.getCurrentDateKey();
        if (this.usage.dailyQueryDate !== currentDateKey) {
            this.usage = {
                ...this.usage,
                dailyQueryDate: currentDateKey,
            };
        }
        this.rebuildDailyUsageFromLogs();
    }
    getCurrentPlan() {
        if (this.isAdmin()) {
            return {
                id: 'admin-preview',
                name: '管理员预览',
                priceLabel: '¥0 / 管理员预览',
                limits: {
                    groupCount: 999,
                    privateDocuments: 999,
                    dailyQueries: 9999,
                    caseSearch: true,
                },
            };
        }
        const latestOrder = this.getLatestSubscriptionOrder();
        if (latestOrder) {
            return this.plans.find((plan) => plan.id === latestOrder.planType) ?? this.plans[0];
        }
        return this.plans.find((plan) => plan.id === this.currentPlanId) ?? this.plans[0];
    }
    getUsage() {
        this.ensureDailyUsageIsCurrent();
        return { ...this.usage };
    }
    syncUsage(usage) {
        this.ensureDailyUsageIsCurrent();
        this.usage = {
            ...this.usage,
            ...usage,
            dailyQueryDate: usage.dailyQueryDate ?? this.usage.dailyQueryDate,
        };
        this.localStateService.saveUsage(this.usage);
    }
    assertCanCreateGroup(currentGroupCount) {
        const limit = this.getCurrentPlan().limits.groupCount;
        if (currentGroupCount >= limit) {
            throw new common_1.BadRequestException('当前套餐的项目组数量已达上限，请升级后继续创建');
        }
    }
    assertCanImportPrivateDocument(currentPrivateDocumentCount) {
        const limit = this.getCurrentPlan().limits.privateDocuments;
        if (currentPrivateDocumentCount >= limit) {
            throw new common_1.BadRequestException('当前套餐的私有库文件数量已达上限，请升级后继续导入');
        }
    }
    assertCanRunQuery(currentDailyQueries) {
        this.ensureDailyUsageIsCurrent();
        const limit = this.getCurrentPlan().limits.dailyQueries;
        if (currentDailyQueries >= limit) {
            throw new common_1.BadRequestException('今日 RAG 查询次数已用完，请明日再试或升级套餐');
        }
    }
    recordQueryLog(queryLog) {
        this.ensureDailyUsageIsCurrent();
        const entity = this.queryLogRepository.createEntity(queryLog);
        this.queryLogs.push(this.queryLogRepository.mapEntity(entity));
        this.persistQueryLogs();
        this.rebuildDailyUsageFromLogs();
    }
    syncSubscriptionOrder(order) {
        const entity = this.subscriptionRepository.createEntity(order);
        const snapshot = this.subscriptionRepository.mapEntity(entity);
        const nextOrders = this.subscriptionOrders.filter((item) => item.id !== snapshot.id);
        nextOrders.push(snapshot);
        this.subscriptionOrders = nextOrders;
        this.persistSubscriptions();
    }
    createSubscriptionOrder(dto) {
        if (this.isAdmin()) {
            throw new common_1.BadRequestException('管理员预览账号不支持创建订阅订单');
        }
        if (this.hasActiveHigherTierOrder(dto.planType)) {
            throw new common_1.BadRequestException('当前高等级订阅仍在有效期内，暂不支持降级为更低套餐');
        }
        const now = new Date();
        const expiredAt = this.addDays(now, this.planDurations[dto.planType]);
        const order = {
            id: `order-${Date.now()}`,
            userId: this.authService.me().id,
            planType: dto.planType,
            amount: this.planPrices[dto.planType],
            paidAt: this.formatDateTime(now),
            expiredAt: this.formatDateTime(expiredAt),
        };
        this.syncSubscriptionOrder(order);
        return order;
    }
    getOverview(actualGroupCount) {
        this.ensureDailyUsageIsCurrent();
        const plan = this.getCurrentPlan();
        const latestOrder = this.getLatestSubscriptionOrder();
        const status = this.getSubscriptionStatus();
        return {
            currentPlanId: latestOrder?.planType ?? this.currentPlanId,
            trialEndsAt: latestOrder?.expiredAt.slice(0, 10) ?? this.trialEndsAt,
            trialDays: this.trialDays,
            status,
            statusLabel: this.getSubscriptionStatusLabel(status),
            latestOrder: latestOrder == null
                ? null
                : {
                    id: latestOrder.id,
                    planType: latestOrder.planType,
                    planLabel: this.getPlanLabel(latestOrder.planType),
                    amount: latestOrder.amount,
                    paidAt: latestOrder.paidAt,
                    expiredAt: latestOrder.expiredAt,
                },
            orderHistory: this.getUserSubscriptionOrders()
                .map((order) => ({
                id: order.id,
                planType: order.planType,
                planLabel: this.getPlanLabel(order.planType),
                amount: order.amount,
                paidAt: order.paidAt,
                expiredAt: order.expiredAt,
            }))
                .slice()
                .reverse(),
            usage: {
                groups: { used: actualGroupCount ?? this.usage.groups, limit: plan.limits.groupCount },
                privateDocuments: { used: this.usage.privateDocuments, limit: plan.limits.privateDocuments },
                dailyQueries: { used: this.usage.dailyQueries, limit: plan.limits.dailyQueries },
            },
            limits: {
                maxGroups: plan.limits.groupCount,
                maxPrivateDocuments: plan.limits.privateDocuments,
                dailyQueryLimit: plan.limits.dailyQueries,
                caseSearchEnabled: plan.limits.caseSearch,
                riskTablePreviewLimit: 10,
            },
            planHighlights: [
                '免费版默认可创建 1 个项目组',
                '私有库文件最多 2 个',
                '每日 RAG 查询次数 10 次',
                '案例查询能力需订阅后开启',
            ],
            plans: this.plans,
            pricing: {
                weekly: '¥70 / 周',
                monthly: '¥200 / 月',
                yearly: '¥2000 / 年',
            },
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService,
        query_log_repository_1.QueryLogRepository,
        subscription_repository_1.SubscriptionRepository,
        auth_service_1.AuthService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map