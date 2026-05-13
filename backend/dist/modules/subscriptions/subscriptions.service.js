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
exports.BuyLibraryAccessDto = exports.CreateSubscriptionOrderDto = exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_validator_1 = require("class-validator");
const query_log_entity_1 = require("../../database/entities/query-log.entity");
const subscription_entity_1 = require("../../database/entities/subscription.entity");
const library_access_entity_1 = require("../../database/entities/library-access.entity");
const date_1 = require("../../utils/date");
const audit_service_1 = require("../audit/audit.service");
const auth_service_1 = require("../auth/auth.service");
const local_state_service_1 = require("./local-state.service");
class CreateSubscriptionOrderDto {
}
exports.CreateSubscriptionOrderDto = CreateSubscriptionOrderDto;
__decorate([
    (0, class_validator_1.IsIn)(['weekly', 'monthly', 'yearly']),
    __metadata("design:type", String)
], CreateSubscriptionOrderDto.prototype, "planType", void 0);
class BuyLibraryAccessDto {
}
exports.BuyLibraryAccessDto = BuyLibraryAccessDto;
__decorate([
    (0, class_validator_1.IsIn)(['local_policy', 'local_case', 'industry', 'national_case']),
    __metadata("design:type", String)
], BuyLibraryAccessDto.prototype, "libraryType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BuyLibraryAccessDto.prototype, "region", void 0);
let SubscriptionsService = class SubscriptionsService {
    constructor(localStateService, subscriptionRepo, queryLogRepo, libraryAccessRepo, authService, auditService) {
        this.localStateService = localStateService;
        this.subscriptionRepo = subscriptionRepo;
        this.queryLogRepo = queryLogRepo;
        this.libraryAccessRepo = libraryAccessRepo;
        this.authService = authService;
        this.auditService = auditService;
        this.currentPlanId = 'free';
        this.trialDays = 1;
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
                activationLabel: '免费试用',
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
                activationLabel: '模拟开通周订阅',
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
                activationLabel: '模拟开通月订阅',
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
                activationLabel: '模拟开通年订阅',
                limits: {
                    groupCount: 100,
                    privateDocuments: 1000,
                    dailyQueries: 5000,
                    caseSearch: true,
                },
            },
        ];
        this.libraryAccessPrices = {
            local_policy: { region: '50.00', all: '200.00' },
            local_case: { region: '50.00', all: '200.00' },
            industry: { region: '80.00', all: '300.00' },
            national_case: { region: '100.00', all: '100.00' },
        };
        this.libraryAccessLabels = {
            local_policy: '地方政策库',
            local_case: '地方案例库',
            industry: '行业专题库',
        };
    }
    isAdmin() {
        return this.authService.me().role === 'admin';
    }
    getCurrentUserTrialEndsAt() {
        return this.authService.me().trialEndsAt;
    }
    getCurrentDateKey() {
        return new Date().toISOString().slice(0, 10);
    }
    buildTrialEndsAt(baseDate = new Date()) {
        return this.addDays(baseDate, this.trialDays).toISOString().slice(0, 10);
    }
    persistQueryLogs() { }
    persistSubscriptions() { }
    async getUserSubscriptionOrders() {
        const currentUserId = this.authService.me().id;
        return this.subscriptionRepo.findBy({ userId: currentUserId });
    }
    async getLatestSubscriptionOrder() {
        const orders = await this.getUserSubscriptionOrders();
        return orders[orders.length - 1] ?? null;
    }
    async getActiveSubscriptionOrder() {
        const now = new Date();
        const orders = await this.subscriptionRepo.find({
            where: { userId: this.authService.me().id },
        });
        const active = orders.filter((o) => o.expiredAt > now);
        if (active.length === 0)
            return null;
        return active.sort((a, b) => this.getCurrentPlanRank(this.normalizePlanType(b.planType)) - this.getCurrentPlanRank(this.normalizePlanType(a.planType)))[0];
    }
    normalizePlanType(planType) {
        if (planType === 'weekly' || planType === 'monthly' || planType === 'yearly')
            return planType;
        return 'free';
    }
    formatDateTime(date) {
        return (0, date_1.formatCst)(date, false);
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
        return order.expiredAt > new Date();
    }
    async getSubscriptionStatus() {
        if (this.isAdmin())
            return 'admin-preview';
        const activeOrder = await this.getActiveSubscriptionOrder();
        if (activeOrder)
            return 'active';
        const trialEndsAt = new Date(`${this.getCurrentUserTrialEndsAt()}T23:59:59.999Z`).getTime();
        if (trialEndsAt >= Date.now())
            return 'trial';
        return 'expired';
    }
    getSubscriptionStatusLabel(status) {
        switch (status) {
            case 'trial': return '试用中';
            case 'active': return '已开通';
            case 'expired': return '试用已结束';
            case 'admin-preview': return '管理员预览';
        }
    }
    async hasActiveHigherTierOrder(planType) {
        const latestOrder = await this.getLatestSubscriptionOrder();
        if (!latestOrder || !this.isOrderActive(latestOrder))
            return false;
        return this.getCurrentPlanRank(this.normalizePlanType(latestOrder.planType)) > this.getCurrentPlanRank(planType);
    }
    async getDailyQueryCount() {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const logs = await this.queryLogRepo.find({
            where: { userId: this.authService.me().id },
        });
        return logs
            .filter((l) => l.queriedAt >= today)
            .reduce((sum, l) => sum + l.consumedQuota, 0);
    }
    async getCurrentPlan() {
        if (this.isAdmin()) {
            return {
                id: 'admin-preview',
                name: '管理员预览',
                priceLabel: '¥0 / 管理员预览',
                activationLabel: '管理员预览',
                limits: { groupCount: 999, privateDocuments: 999, dailyQueries: 9999, caseSearch: true },
            };
        }
        const activeOrder = await this.getActiveSubscriptionOrder();
        if (activeOrder) {
            return this.plans.find((plan) => plan.id === activeOrder.planType) ?? this.plans[0];
        }
        return this.plans.find((plan) => plan.id === this.currentPlanId) ?? this.plans[0];
    }
    async getUsage() {
        const dailyQueries = await this.getDailyQueryCount();
        return { dailyQueries, dailyQueryDate: this.getCurrentDateKey() };
    }
    syncUsage(_usage) {
    }
    async assertCanCreateGroup(currentGroupCount) {
        const plan = await this.getCurrentPlan();
        if (currentGroupCount >= plan.limits.groupCount) {
            throw new common_1.BadRequestException('当前套餐的项目组数量已达上限，请升级后继续创建');
        }
    }
    async getGroupLimitForUser(userId) {
        const now = new Date();
        const orders = await this.subscriptionRepo.find({ where: { userId } });
        const active = orders
            .filter((o) => o.expiredAt > now)
            .sort((a, b) => this.getCurrentPlanRank(this.normalizePlanType(b.planType)) - this.getCurrentPlanRank(this.normalizePlanType(a.planType)))[0];
        const planId = active ? this.normalizePlanType(active.planType) : 'free';
        return this.plans.find((p) => p.id === planId)?.limits.groupCount ?? this.plans[0].limits.groupCount;
    }
    async assertCanImportPrivateDocument(currentPrivateDocumentCount) {
        const plan = await this.getCurrentPlan();
        if (currentPrivateDocumentCount >= plan.limits.privateDocuments) {
            throw new common_1.BadRequestException('当前套餐的私有库文件数量已达上限，请升级后继续导入');
        }
    }
    async assertCanRunQuery(currentDailyQueries) {
        const plan = await this.getCurrentPlan();
        if (currentDailyQueries >= plan.limits.dailyQueries) {
            throw new common_1.BadRequestException('今日 RAG 查询次数已用完，请明日再试或升级套餐');
        }
    }
    async recordQueryLog(queryLog) {
        const entity = this.queryLogRepo.create({
            id: queryLog.id,
            userId: queryLog.userId,
            teamId: queryLog.teamId,
            queryText: queryLog.queryText,
            queryResult: queryLog.queryResult,
            queriedAt: new Date(queryLog.queriedAt.replace(' ', 'T')),
            consumedQuota: queryLog.consumedQuota,
            queryScope: queryLog.queryScope ?? null,
        });
        await this.queryLogRepo.save(entity);
    }
    async getQueryHistory(userId, teamId, limit = 20) {
        const where = teamId ? { userId, teamId } : { userId, teamId: (0, typeorm_2.IsNull)() };
        const logs = await this.queryLogRepo.find({
            where,
            order: { queriedAt: 'DESC' },
            take: limit,
        });
        return logs.map(log => ({
            id: log.id,
            queryText: log.queryText,
            queryResult: log.queryResult,
            queriedAt: log.queriedAt.toISOString(),
            queryScope: log.queryScope,
        }));
    }
    async syncSubscriptionOrder(order) {
        await this.subscriptionRepo.upsert({
            id: order.id,
            userId: order.userId,
            planType: order.planType,
            amount: order.amount,
            paidAt: new Date(order.paidAt.replace(' ', 'T')),
            expiredAt: new Date(order.expiredAt.replace(' ', 'T')),
        }, ['id']);
    }
    async createSubscriptionOrder(dto) {
        if (this.isAdmin())
            throw new common_1.BadRequestException('管理员预览账号不支持创建模拟订阅');
        if (await this.hasActiveHigherTierOrder(dto.planType))
            throw new common_1.BadRequestException('当前高等级订阅仍在有效期内，暂不支持降级为更低套餐');
        const now = new Date();
        const expiredAt = this.addDays(now, this.planDurations[dto.planType]);
        const user = this.authService.me();
        await this.syncSubscriptionOrder({
            id: `order-${Date.now()}`,
            userId: user.id,
            planType: dto.planType,
            amount: this.planPrices[dto.planType],
            paidAt: this.formatDateTime(now),
            expiredAt: this.formatDateTime(expiredAt),
        });
        const order = await this.subscriptionRepo.findOneBy({ userId: user.id, planType: dto.planType });
        await this.auditService.recordEvent({
            eventType: 'subscription.activate',
            actorUserId: user.id,
            actorName: user.name,
            targetType: 'subscription',
            targetId: order.id,
            summary: `模拟开通了${this.getPlanLabel(dto.planType)}`,
            detail: { planType: dto.planType, amount: this.planPrices[dto.planType], expiredAt: this.formatDateTime(expiredAt), activationMode: 'simulation' },
        });
        return { activationMode: 'simulation', message: `${this.getPlanLabel(dto.planType)}已模拟开通。` };
    }
    async hasActiveSubscription() {
        return (await this.getActiveSubscriptionOrder()) !== null;
    }
    async getActiveLibraryAccess(userId) {
        const uid = userId ?? this.authService.me().id;
        const now = new Date();
        const all = await this.libraryAccessRepo.findBy({ userId: uid });
        return all.filter((a) => a.expiredAt > now);
    }
    async canAccessLibrary(libraryType, region) {
        if (this.isAdmin())
            return true;
        if (libraryType === 'regulation')
            return true;
        const active = await this.getActiveLibraryAccess();
        return active.some((a) => a.libraryType === libraryType && (a.region === null || a.region === region));
    }
    async buyLibraryAccess(dto) {
        if (this.isAdmin())
            throw new common_1.BadRequestException('管理员无需购买');
        const user = this.authService.me();
        const prices = this.libraryAccessPrices[dto.libraryType];
        const amount = dto.region ? prices.region : prices.all;
        const now = new Date();
        const expiredAt = this.addDays(now, 365);
        const id = `la-${Date.now()}`;
        await this.libraryAccessRepo.save(this.libraryAccessRepo.create({ id, userId: user.id, libraryType: dto.libraryType, region: dto.region ?? null, amount, paidAt: now, expiredAt }));
        const label = `${this.libraryAccessLabels[dto.libraryType]}${dto.region ? `（${dto.region}）` : '（全部地区）'}`;
        await this.auditService.recordEvent({
            eventType: 'subscription.activate',
            actorUserId: user.id,
            actorName: user.name,
            targetType: 'library_access',
            targetId: id,
            summary: `购买了${label}访问权限`,
            detail: { libraryType: dto.libraryType, region: dto.region ?? null, amount, activationMode: 'simulation' },
        });
        return { message: `${label}访问权限已开通（1年）。` };
    }
    async getOverview(actualGroupCount, actualPrivateDocuments) {
        const plan = await this.getCurrentPlan();
        const latestOrder = await this.getLatestSubscriptionOrder();
        const activeOrder = await this.getActiveSubscriptionOrder();
        const status = await this.getSubscriptionStatus();
        const dailyQueries = await this.getDailyQueryCount();
        const mapOrder = (o) => ({
            id: o.id,
            planType: this.normalizePlanType(o.planType),
            planLabel: this.getPlanLabel(this.normalizePlanType(o.planType)),
            amount: o.amount,
            paidAt: (0, date_1.formatCst)(o.paidAt, false),
            expiredAt: (0, date_1.formatCst)(o.expiredAt, false),
        });
        const allOrders = await this.getUserSubscriptionOrders();
        const activeLibraryAccess = await this.getActiveLibraryAccess();
        return {
            currentPlanId: plan.id,
            trialEndsAt: this.getCurrentUserTrialEndsAt(),
            trialDays: this.trialDays,
            status,
            statusLabel: this.getSubscriptionStatusLabel(status),
            latestOrder: latestOrder ? mapOrder(latestOrder) : null,
            effectiveOrder: activeOrder ? mapOrder(activeOrder) : null,
            orderHistory: allOrders.map(mapOrder).reverse(),
            usage: {
                groups: { used: actualGroupCount ?? 0, limit: plan.limits.groupCount },
                privateDocuments: { used: actualPrivateDocuments ?? 0, limit: plan.limits.privateDocuments },
                dailyQueries: { used: dailyQueries, limit: plan.limits.dailyQueries },
            },
            limits: {
                maxGroups: plan.limits.groupCount,
                maxPrivateDocuments: plan.limits.privateDocuments,
                dailyQueryLimit: plan.limits.dailyQueries,
                caseSearchEnabled: plan.limits.caseSearch,
                riskTablePreviewLimit: 10,
            },
            planHighlights: [
                `当前可创建 ${plan.limits.groupCount} 个项目组`,
                `私有库文件最多 ${plan.limits.privateDocuments} 个`,
                `每日 RAG 查询次数 ${plan.limits.dailyQueries} 次`,
                plan.limits.caseSearch ? '案例查询能力已包含' : '案例查询能力需订阅后开启',
            ],
            plans: this.plans,
            pricing: { weekly: '¥70 / 周', monthly: '¥200 / 月', yearly: '¥2000 / 年' },
            libraryAccess: activeLibraryAccess.map((a) => ({
                id: a.id,
                libraryType: a.libraryType,
                region: a.region,
                expiredAt: (0, date_1.formatCst)(a.expiredAt, false),
            })),
            libraryAccessPrices: this.libraryAccessPrices,
        };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(subscription_entity_1.SubscriptionEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(query_log_entity_1.QueryLogEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(library_access_entity_1.LibraryAccessEntity)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => auth_service_1.AuthService))),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService,
        audit_service_1.AuditService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map