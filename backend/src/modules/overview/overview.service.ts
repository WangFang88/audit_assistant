import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { QueryService } from '../query/query.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class OverviewService {
  constructor(
    private readonly authService: AuthService,
    private readonly groupsService: GroupsService,
    private readonly documentsService: DocumentsService,
    private readonly queryService: QueryService,
    private readonly chatService: ChatService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  getDashboard(groupId?: string) {
    const user = this.authService.me();
    const isAdmin = user.role === 'admin';
    const visibleGroups = isAdmin ? [] : this.groupsService.listGroups();
    const effectiveGroupId = isAdmin ? undefined : groupId ?? visibleGroups[0]?.id;
    const activeGroup = effectiveGroupId ? this.groupsService.getGroupById(effectiveGroupId) : null;

    return {
      user,
      activeContext: {
        groupId: effectiveGroupId ?? null,
        groupName: activeGroup?.name ?? null,
        queryScopeLabel: effectiveGroupId == null ? '仅公共库' : '公共库 + 当前项目组私有库',
        isolationNotice:
          effectiveGroupId == null
            ? isAdmin
              ? '当前为管理员视角，仅管理公共基础库，不加入项目组。'
              : '当前未进入项目组，仅可检索公共基础库。'
            : '当前仅检索本项目组私有资料，不跨项目组读取私有库。',
      },
      roadmap: [
        {
          version: '1.0',
          title: '双库检索与协作',
          deadline: '五一前',
          ragFocus: '公共库 + 当前项目组私有库双库 RAG 检索',
        },
        {
          version: '2.0',
          title: '案例参考',
          deadline: '5月9日',
          ragFocus: '案例检索与法条结合解释',
        },
        {
          version: '3.0',
          title: '审计辅助生成',
          deadline: '5月29日',
          ragFocus: '工作底稿与风险排查表辅助生成',
        },
      ],
      architectureTargets: {
        generationProviderTarget: 'Qwen',
        vectorStoreTarget: 'pgvector',
        retrievalMode: 'hybrid',
        parserTarget: 'multimodal-parser',
        deliveryMode: 'browser + mobile + PWA',
      },
      groups: visibleGroups,
      members: effectiveGroupId ? this.groupsService.listMembers(effectiveGroupId) : [],
      documents: this.documentsService.listDocuments(effectiveGroupId),
      extractJobs: this.documentsService.listExtractionJobs(effectiveGroupId),
      libraryScope: this.documentsService.getLibraryScopeSummary(effectiveGroupId),
      subscription: this.subscriptionsService.getOverview(),
      conversations: isAdmin ? [] : this.chatService.listConversations(effectiveGroupId),
      featuredQuery: this.queryService.search({
        question: '请检索与专项资金使用和采购审批相关的制度依据。',
        groupId: effectiveGroupId,
      }),
    };
  }
}
