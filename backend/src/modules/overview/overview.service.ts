import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';

@Injectable()
export class OverviewService {
  constructor(
    private readonly authService: AuthService,
    private readonly groupsService: GroupsService,
    private readonly documentsService: DocumentsService,
    private readonly chatService: ChatService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly teamAgentsService: TeamAgentsService,
    private readonly auditService: AuditService,
  ) {}

  async getDashboard(groupId?: string) {
    const user = this.authService.me();
    const isAdmin = user.role === 'admin';
    const visibleGroups = isAdmin ? [] : await this.groupsService.listGroups();
    const effectiveGroupId = isAdmin ? undefined : groupId ?? visibleGroups[0]?.id;

    const [activeGroup, activeTeamAgent, members, documents, extractJobs, libraryScope, privateDocCount, recentAuditEvents, conversations] =
      await Promise.all([
        effectiveGroupId ? this.groupsService.getGroupById(effectiveGroupId) : Promise.resolve(null),
        effectiveGroupId ? this.teamAgentsService.getVisibleAgentByGroupId(effectiveGroupId) : Promise.resolve(null),
        effectiveGroupId ? this.groupsService.listMembers(effectiveGroupId) : Promise.resolve([]),
        this.documentsService.listDocuments(effectiveGroupId),
        this.documentsService.listExtractionJobs(effectiveGroupId),
        this.documentsService.getLibraryScopeSummary(effectiveGroupId),
        this.documentsService.countPrivateDocuments(visibleGroups.map((g) => g.id)),
        this.auditService.listRecentEvents(10, {
          isAdmin,
          userId: user.id,
          groupIds: visibleGroups.map((g) => g.id),
        }),
        isAdmin ? Promise.resolve([]) : this.chatService.listConversations(effectiveGroupId),
      ]);

    return {
      user,
      activeContext: {
        groupId: effectiveGroupId ?? null,
        groupName: activeGroup?.name ?? null,
        agentId: activeTeamAgent?.id ?? null,
        agentName: activeTeamAgent?.name ?? null,
        agentCapabilities: activeTeamAgent?.capabilities ?? [],
        knowledgeScopeLabel: activeTeamAgent == null ? '未启用项目组 Agent' : '公共库 + 当前项目组私有库',
        queryScopeLabel: effectiveGroupId == null ? '仅公共库' : '公共库 + 当前项目组私有库',
        isolationNotice:
          effectiveGroupId == null
            ? isAdmin
              ? '当前为管理员视角，仅管理公共基础库，不加入项目组。'
              : '当前未进入项目组，仅可检索公共基础库。'
            : '当前仅检索本项目组私有资料，不跨项目组读取私有库。',
      },
      roadmap: [
        { version: '1.0', title: '双库检索与协作', deadline: '五一前', ragFocus: '公共库 + 当前项目组私有库双库 RAG 检索' },
        { version: '2.0', title: '案例参考', deadline: '5月9日', ragFocus: '案例检索与法条结合解释' },
        { version: '3.0', title: '审计辅助生成', deadline: '5月29日', ragFocus: '工作底稿与风险排查表辅助生成' },
      ],
      architectureTargets: {
        generationProviderTarget: 'Qwen',
        vectorStoreTarget: 'pgvector',
        retrievalMode: 'hybrid',
        parserTarget: 'multimodal-parser',
        deliveryMode: 'browser + mobile + PWA',
      },
      groups: visibleGroups,
      members,
      documents,
      extractJobs,
      libraryScope,
      subscription: this.subscriptionsService.getOverview(visibleGroups.length, privateDocCount),
      recentAuditEvents,
      conversations,
      activeTeamAgent:
        activeTeamAgent == null
          ? null
          : {
              id: activeTeamAgent.id,
              name: activeTeamAgent.name,
              groupId: activeTeamAgent.groupId,
              capabilities: activeTeamAgent.capabilities,
              defaultConversationId: activeTeamAgent.defaultConversationId,
              retrievalScope: activeTeamAgent.config.retrievalScope,
            },
      featuredQuery: null,
    };
  }
}
