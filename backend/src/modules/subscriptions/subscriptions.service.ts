import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LocalStateService } from './local-state.service';

type UsageSnapshot = {
  groups: number;
  privateDocuments: number;
  dailyQueries: number;
  dailyQueryDate: string;
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly localStateService: LocalStateService,
    @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
  ) {
    const persistedState = this.localStateService.readState();
    if (persistedState.usage) {
      this.usage = {
        ...this.usage,
        ...persistedState.usage,
      };
    }

    this.ensureDailyUsageIsCurrent();
  }

  private readonly currentPlanId = 'free';
  private readonly trialEndsAt = '2026-05-01';
  private readonly trialDays = 1;
  private usage: UsageSnapshot = {
    groups: 1,
    privateDocuments: 2,
    dailyQueries: 6,
    dailyQueryDate: this.getCurrentDateKey(),
  };

  private readonly plans = [
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

  private isAdmin() {
    return this.authService.me().role === 'admin';
  }

  private getCurrentDateKey() {
    return new Date().toISOString().slice(0, 10);
  }

  private ensureDailyUsageIsCurrent() {
    const currentDateKey = this.getCurrentDateKey();
    if (this.usage.dailyQueryDate === currentDateKey) {
      return;
    }

    this.usage = {
      ...this.usage,
      dailyQueries: 0,
      dailyQueryDate: currentDateKey,
    };
    this.localStateService.saveUsage(this.usage);
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

  consumeQuery() {
    this.ensureDailyUsageIsCurrent();
    this.usage.dailyQueries += 1;
    this.localStateService.saveUsage(this.usage);
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
}
