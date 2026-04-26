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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const query_log_repository_1 = require("../../database/repositories/query-log.repository");
const auth_service_1 = require("../auth/auth.service");
const local_state_service_1 = require("./local-state.service");
let SubscriptionsService = class SubscriptionsService {
    constructor(localStateService, queryLogRepository, authService) {
        this.localStateService = localStateService;
        this.queryLogRepository = queryLogRepository;
        this.authService = authService;
        this.currentPlanId = 'free';
        this.trialEndsAt = '2026-05-01';
        this.trialDays = 1;
        this.queryLogs = [];
        this.usage = {
            groups: 1,
            privateDocuments: 2,
            dailyQueries: 6,
            dailyQueryDate: this.getCurrentDateKey(),
        };
        this.plans = [
            {
                id: 'free',
                name: '免费版',
                priceLabel: '¥0 / 1天试用',
                limits: {
                    groupCount: 1,
                    privateDocuments: 2,
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
    getOverview() {
        this.ensureDailyUsageIsCurrent();
        const plan = this.getCurrentPlan();
        return {
            currentPlanId: this.currentPlanId,
            trialEndsAt: this.trialEndsAt,
            trialDays: this.trialDays,
            usage: {
                groups: { used: this.usage.groups, limit: plan.limits.groupCount },
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
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService,
        query_log_repository_1.QueryLogRepository,
        auth_service_1.AuthService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map