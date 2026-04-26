import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionsService {
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

  getOverview() {
    return {
      currentPlanId: 'free',
      trialEndsAt: '2026-05-01',
      trialDays: 1,
      usage: {
        groups: { used: 1, limit: 1 },
        privateDocuments: { used: 2, limit: 2 },
        dailyQueries: { used: 6, limit: 10 },
      },
      limits: {
        maxGroups: 1,
        maxPrivateDocuments: 2,
        dailyQueryLimit: 10,
        caseSearchEnabled: false,
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
