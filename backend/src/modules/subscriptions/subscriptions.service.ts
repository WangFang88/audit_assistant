import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { QueryLogRepository, QueryLogSnapshot } from '../../database/repositories/query-log.repository';
import { SubscriptionOrderSnapshot, SubscriptionRepository } from '../../database/repositories/subscription.repository';
import { AuthService } from '../auth/auth.service';
import { LocalStateService } from './local-state.service';

class CreateSubscriptionOrderDto {
  @IsIn(['weekly', 'monthly', 'yearly'])
  planType!: 'weekly' | 'monthly' | 'yearly';
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
    private readonly queryLogRepository: QueryLogRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) {
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

  private readonly currentPlanId = 'free';
  private readonly trialEndsAt = '2026-05-01';
  private readonly trialDays = 1;
  private queryLogs: QueryLogSnapshot[] = [];
  private subscriptionOrders: SubscriptionOrderSnapshot[] = [
    {
      id: 'order-free-1',
      userId: 'user-2',
      planType: 'free',
      amount: '0.00',
      paidAt: '2026-04-25 09:00',
      expiredAt: '2026-05-01 00:00',
    },
  ];
  private usage: UsageSnapshot = {
    groups: 1,
    privateDocuments: 0,
    dailyQueries: 0,
    dailyQueryDate: this.getCurrentDateKey(),
  };

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

  private isAdmin() {
    return this.authService.me().role === 'admin';
  }

  private getCurrentDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  private persistQueryLogs() {
    this.localStateService.saveQueryLogs(this.queryLogs);
  }

  private persistSubscriptions() {
    this.localStateService.saveSubscriptions(this.subscriptionOrders);
  }

  private getUserSubscriptionOrders() {
    const currentUserId = this.authService.me().id;
    return this.subscriptionOrders.filter((order) => order.userId === currentUserId);
  }

  private getLatestSubscriptionOrder() {
    const userOrders = this.getUserSubscriptionOrders();
    return userOrders[userOrders.length - 1] ?? null;
  }

  private formatDateTime(date: Date) {
    return date.toISOString().slice(0, 16).replace('T', ' ');
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

  private isOrderActive(order: SubscriptionOrderSnapshot) {
    return new Date(order.expiredAt.replace(' ', 'T')).getTime() > Date.now();
  }

  private getSubscriptionStatus(): SubscriptionStatus {
    if (this.isAdmin()) {
      return 'admin-preview';
    }

    const latestOrder = this.getLatestSubscriptionOrder();
    if (latestOrder) {
      return this.isOrderActive(latestOrder) ? 'active' : 'expired';
    }

    return 'trial';
  }

  private getSubscriptionStatusLabel(status: SubscriptionStatus) {
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

  private hasActiveHigherTierOrder(planType: 'weekly' | 'monthly' | 'yearly') {
    const latestOrder = this.getLatestSubscriptionOrder();
    if (!latestOrder) {
      return false;
    }

    if (!this.isOrderActive(latestOrder)) {
      return false;
    }

    return this.getCurrentPlanRank(latestOrder.planType) > this.getCurrentPlanRank(planType);
  }

  private rebuildDailyUsageFromLogs() {
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

  private ensureDailyUsageIsCurrent() {
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

  syncUsage(usage: Partial<UsageSnapshot>) {
    this.ensureDailyUsageIsCurrent();
    this.usage = {
      ...this.usage,
      ...usage,
      dailyQueryDate: usage.dailyQueryDate ?? this.usage.dailyQueryDate,
    };
    this.localStateService.saveUsage(this.usage);
  }

  assertCanCreateGroup(currentGroupCount: number) {
    const limit = this.getCurrentPlan().limits.groupCount;
    if (currentGroupCount >= limit) {
      throw new BadRequestException('当前套餐的项目组数量已达上限，请升级后继续创建');
    }
  }

  assertCanImportPrivateDocument(currentPrivateDocumentCount: number) {
    const limit = this.getCurrentPlan().limits.privateDocuments;
    if (currentPrivateDocumentCount >= limit) {
      throw new BadRequestException('当前套餐的私有库文件数量已达上限，请升级后继续导入');
    }
  }

  assertCanRunQuery(currentDailyQueries: number) {
    this.ensureDailyUsageIsCurrent();
    const limit = this.getCurrentPlan().limits.dailyQueries;
    if (currentDailyQueries >= limit) {
      throw new BadRequestException('今日 RAG 查询次数已用完，请明日再试或升级套餐');
    }
  }

  recordQueryLog(queryLog: QueryLogSnapshot) {
    this.ensureDailyUsageIsCurrent();
    const entity = this.queryLogRepository.createEntity(queryLog);
    this.queryLogs.push(this.queryLogRepository.mapEntity(entity));
    this.persistQueryLogs();
    this.rebuildDailyUsageFromLogs();
  }

  syncSubscriptionOrder(order: SubscriptionOrderSnapshot) {
    const entity = this.subscriptionRepository.createEntity(order);
    const snapshot = this.subscriptionRepository.mapEntity(entity);
    const nextOrders = this.subscriptionOrders.filter((item) => item.id !== snapshot.id);
    nextOrders.push(snapshot);
    this.subscriptionOrders = nextOrders;
    this.persistSubscriptions();
  }

  createSubscriptionOrder(dto: CreateSubscriptionOrderDto) {
    if (this.isAdmin()) {
      throw new BadRequestException('管理员预览账号不支持创建订阅订单');
    }
    if (this.hasActiveHigherTierOrder(dto.planType)) {
      throw new BadRequestException('当前高等级订阅仍在有效期内，暂不支持降级为更低套餐');
    }

    const now = new Date();
    const expiredAt = this.addDays(now, this.planDurations[dto.planType]);

    const order: SubscriptionOrderSnapshot = {
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

  getOverview(actualGroupCount?: number) {
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
}

export { CreateSubscriptionOrderDto };
