import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { QueryLogEntity } from '../../database/entities/query-log.entity';
import { SubscriptionEntity } from '../../database/entities/subscription.entity';
import { LibraryAccessEntity } from '../../database/entities/library-access.entity';
import { formatCst } from '../../utils/date';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { LocalStateService } from './local-state.service';

class CreateSubscriptionOrderDto {
  @IsIn(['weekly', 'monthly', 'yearly'])
  planType!: 'weekly' | 'monthly' | 'yearly';
}

class BuyLibraryAccessDto {
  @IsIn(['local_policy', 'local_case', 'industry', 'national_case'])
  libraryType!: 'local_policy' | 'local_case' | 'industry' | 'national_case';

  // null = 全部地区，否则指定地区如 'beijing'
  @IsOptional()
  @IsString()
  region?: string;
}

type UsageSnapshot = {
  groups: number;
  privateDocuments: number;
  dailyQueries: number;
  dailyQueryDate: string;
};

type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'admin-preview';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly localStateService: LocalStateService,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepo: Repository<SubscriptionEntity>,
    @InjectRepository(QueryLogEntity)
    private readonly queryLogRepo: Repository<QueryLogEntity>,
    @InjectRepository(LibraryAccessEntity)
    private readonly libraryAccessRepo: Repository<LibraryAccessEntity>,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  private readonly currentPlanId = 'free';
  private readonly trialDays = 1;

  private readonly planPrices: Record<'weekly' | 'monthly' | 'yearly', string> = {
    weekly: '70.00',
    monthly: '200.00',
    yearly: '2000.00',
  };

  private readonly planDurations: Record<'weekly' | 'monthly' | 'yearly', number> = {
    weekly: 7,
    monthly: 30,
    yearly: 365,
  };

  private readonly planRank: Record<'free' | 'weekly' | 'monthly' | 'yearly', number> = {
    free: 0,
    weekly: 1,
    monthly: 2,
    yearly: 3,
  };

  private readonly plans = [
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
  ] as const;

  private isAdmin() {
    return this.authService.me().role === 'admin';
  }

  private getCurrentUserTrialEndsAt() {
    return this.authService.me().trialEndsAt;
  }

  private getCurrentDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  buildTrialEndsAt(baseDate: Date = new Date()) {
    return this.addDays(baseDate, this.trialDays).toISOString().slice(0, 10);
  }

  private persistQueryLogs() {}

  private persistSubscriptions() {}

  private async getUserSubscriptionOrders() {
    const currentUserId = this.authService.me().id;
    return this.subscriptionRepo.findBy({ userId: currentUserId });
  }

  private async getLatestSubscriptionOrder() {
    const orders = await this.getUserSubscriptionOrders();
    return orders[orders.length - 1] ?? null;
  }

  private async getActiveSubscriptionOrder() {
    const now = new Date();
    const orders = await this.subscriptionRepo.find({
      where: { userId: this.authService.me().id },
    });
    const active = orders.filter((o) => o.expiredAt > now);
    if (active.length === 0) return null;
    return active.sort((a, b) => this.getCurrentPlanRank(this.normalizePlanType(b.planType)) - this.getCurrentPlanRank(this.normalizePlanType(a.planType)))[0];
  }

  private normalizePlanType(planType: string): 'free' | 'weekly' | 'monthly' | 'yearly' {
    if (planType === 'weekly' || planType === 'monthly' || planType === 'yearly') return planType;
    return 'free';
  }

  private formatDateTime(date: Date) {
    return formatCst(date, false);
  }

  private addDays(baseDate: Date, days: number) {
    const nextDate = new Date(baseDate.getTime());
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
  }

  private getCurrentPlanRank(planType: 'free' | 'weekly' | 'monthly' | 'yearly') {
    return this.planRank[planType];
  }

  private getPlanLabel(planType: 'free' | 'weekly' | 'monthly' | 'yearly') {
    return this.plans.find((plan) => plan.id === planType)?.name ?? planType;
  }

  private isOrderActive(order: SubscriptionEntity) {
    return order.expiredAt > new Date();
  }

  private async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (this.isAdmin()) return 'admin-preview';
    const activeOrder = await this.getActiveSubscriptionOrder();
    if (activeOrder) return 'active';
    const trialEndsAt = new Date(`${this.getCurrentUserTrialEndsAt()}T23:59:59.999Z`).getTime();
    if (trialEndsAt >= Date.now()) return 'trial';
    return 'expired';
  }

  private getSubscriptionStatusLabel(status: SubscriptionStatus) {
    switch (status) {
      case 'trial': return '试用中';
      case 'active': return '已开通';
      case 'expired': return '试用已结束';
      case 'admin-preview': return '管理员预览';
    }
  }

  private async hasActiveHigherTierOrder(planType: 'weekly' | 'monthly' | 'yearly') {
    const latestOrder = await this.getLatestSubscriptionOrder();
    if (!latestOrder || !this.isOrderActive(latestOrder)) return false;
    return this.getCurrentPlanRank(this.normalizePlanType(latestOrder.planType)) > this.getCurrentPlanRank(planType);
  }

  private async getDailyQueryCount(): Promise<number> {
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

  syncUsage(_usage: Partial<UsageSnapshot>) {
    // usage now computed from DB, no-op
  }

  async assertCanCreateGroup(currentGroupCount: number) {
    const plan = await this.getCurrentPlan();
    if (currentGroupCount >= plan.limits.groupCount) {
      throw new BadRequestException('当前套餐的项目组数量已达上限，请升级后继续创建');
    }
  }

  async getGroupLimitForUser(userId: string): Promise<number> {
    const now = new Date();
    const orders = await this.subscriptionRepo.find({ where: { userId } });
    const active = orders
      .filter((o) => o.expiredAt > now)
      .sort((a, b) => this.getCurrentPlanRank(this.normalizePlanType(b.planType)) - this.getCurrentPlanRank(this.normalizePlanType(a.planType)))[0];
    const planId = active ? this.normalizePlanType(active.planType) : 'free';
    return this.plans.find((p) => p.id === planId)?.limits.groupCount ?? this.plans[0].limits.groupCount;
  }

  async assertCanImportPrivateDocument(currentPrivateDocumentCount: number) {
    const plan = await this.getCurrentPlan();
    if (currentPrivateDocumentCount >= plan.limits.privateDocuments) {
      throw new BadRequestException('当前套餐的私有库文件数量已达上限，请升级后继续导入');
    }
  }

  async assertCanRunQuery(currentDailyQueries: number) {
    const plan = await this.getCurrentPlan();
    if (currentDailyQueries >= plan.limits.dailyQueries) {
      throw new BadRequestException('今日 RAG 查询次数已用完，请明日再试或升级套餐');
    }
  }

  async recordQueryLog(queryLog: { id: string; userId: string; teamId: string | null; queryText: string; queriedAt: string; consumedQuota: number; queryResult?: any }) {
    const entity = this.queryLogRepo.create({
      id: queryLog.id,
      userId: queryLog.userId,
      teamId: queryLog.teamId,
      queryText: queryLog.queryText,
      queryResult: queryLog.queryResult,
      queriedAt: new Date(queryLog.queriedAt.replace(' ', 'T')),
      consumedQuota: queryLog.consumedQuota,
    });
    await this.queryLogRepo.save(entity);
  }

  async getQueryHistory(userId: string, teamId: string | null, limit = 20) {
    const where = teamId ? { teamId } : { userId, teamId: IsNull() };
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
    }));
  }

  async syncSubscriptionOrder(order: { id: string; userId: string; planType: string; amount: string; paidAt: string; expiredAt: string }) {
    await this.subscriptionRepo.upsert({
      id: order.id,
      userId: order.userId,
      planType: order.planType,
      amount: order.amount,
      paidAt: new Date(order.paidAt.replace(' ', 'T')),
      expiredAt: new Date(order.expiredAt.replace(' ', 'T')),
    }, ['id']);
  }

  async createSubscriptionOrder(dto: CreateSubscriptionOrderDto) {
    if (this.isAdmin()) throw new BadRequestException('管理员预览账号不支持创建模拟订阅');
    if (await this.hasActiveHigherTierOrder(dto.planType)) throw new BadRequestException('当前高等级订阅仍在有效期内，暂不支持降级为更低套餐');

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
      targetId: order!.id,
      summary: `模拟开通了${this.getPlanLabel(dto.planType)}`,
      detail: { planType: dto.planType, amount: this.planPrices[dto.planType], expiredAt: this.formatDateTime(expiredAt), activationMode: 'simulation' },
    });
    return { activationMode: 'simulation', message: `${this.getPlanLabel(dto.planType)}已模拟开通。` };
  }

  private readonly libraryAccessPrices: Record<'local_policy' | 'local_case' | 'industry' | 'national_case', { region: string; all: string }> = {
    local_policy:  { region: '50.00',  all: '200.00' },
    local_case:    { region: '50.00',  all: '200.00' },
    industry:      { region: '80.00',  all: '300.00' },
    national_case: { region: '100.00', all: '100.00' },
  };

  private readonly libraryAccessLabels: Record<string, string> = {
    local_policy: '地方政策库',
    local_case: '地方案例库',
    industry: '行业专题库',
  };

  async hasActiveSubscription(): Promise<boolean> {
    return (await this.getActiveSubscriptionOrder()) !== null;
  }

  async getActiveLibraryAccess(userId?: string): Promise<LibraryAccessEntity[]> {
    const uid = userId ?? this.authService.me().id;
    const now = new Date();
    const all = await this.libraryAccessRepo.findBy({ userId: uid });
    return all.filter((a) => a.expiredAt > now);
  }

  async canAccessLibrary(libraryType: string, region: string | null): Promise<boolean> {
    if (this.isAdmin()) return true;
    if (libraryType === 'regulation') return true;
    const active = await this.getActiveLibraryAccess();
    return active.some(
      (a) => a.libraryType === libraryType && (a.region === null || a.region === region),
    );
  }

  async buyLibraryAccess(dto: BuyLibraryAccessDto) {
    if (this.isAdmin()) throw new BadRequestException('管理员无需购买');
    const user = this.authService.me();
    const prices = this.libraryAccessPrices[dto.libraryType];
    const amount = dto.region ? prices.region : prices.all;
    const now = new Date();
    const expiredAt = this.addDays(now, 365);
    const id = `la-${Date.now()}`;
    await this.libraryAccessRepo.save(
      this.libraryAccessRepo.create({ id, userId: user.id, libraryType: dto.libraryType, region: dto.region ?? null, amount, paidAt: now, expiredAt }),
    );
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

  async getOverview(actualGroupCount?: number, actualPrivateDocuments?: number) {
    const plan = await this.getCurrentPlan();
    const latestOrder = await this.getLatestSubscriptionOrder();
    const activeOrder = await this.getActiveSubscriptionOrder();
    const status = await this.getSubscriptionStatus();
    const dailyQueries = await this.getDailyQueryCount();

    const mapOrder = (o: SubscriptionEntity) => ({
      id: o.id,
      planType: this.normalizePlanType(o.planType),
      planLabel: this.getPlanLabel(this.normalizePlanType(o.planType)),
      amount: o.amount,
      paidAt: formatCst(o.paidAt, false),
      expiredAt: formatCst(o.expiredAt, false),
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
        expiredAt: formatCst(a.expiredAt, false),
      })),
      libraryAccessPrices: this.libraryAccessPrices,
    };
  }
}

export { CreateSubscriptionOrderDto, BuyLibraryAccessDto };
