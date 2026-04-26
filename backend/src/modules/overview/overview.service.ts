import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { QueryService } from '../query/query.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';

@Injectable()
export class OverviewService {
  constructor(
    private readonly authService: AuthService,
    private readonly groupsService: GroupsService,
    private readonly documentsService: DocumentsService,
    private readonly queryService: QueryService,
    private readonly chatService: ChatService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly teamAgentsService: TeamAgentsService,
  ) {}

  getDashboard(groupId?: string) {
    const user = this.authService.me();
    const isAdmin = user.role === 'admin';
    const visibleGroups = isAdmin ? [] : this.groupsService.listGroups();
    const effectiveGroupId = isAdmin ? undefined : groupId ?? visibleGroups[0]?.id;
    const activeGroup = effectiveGroupId ? this.groupsService.getGroupById(effectiveGroupId) : null;
    const activeTeamAgent = effectiveGroupId ? this.teamAgentsService.getVisibleAgentByGroupId(effectiveGroupId) : null;
    let featuredQuery;

    try {
      featuredQuery = this.queryService.search({
        question: '请检索与专项资金使用和采购审批相关的制度依据。',
        groupId: effectiveGroupId,
        agentId: activeTeamAgent?.id,
      });
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      featuredQuery = {
        question: '请检索与专项资金使用和采购审批相关的制度依据。',
        agentMode: activeTeamAgent != null,
        agent:
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
        scope: {
          scopeMode: effectiveGroupId == null ? 'public_only' : 'public_plus_current_group_private',
          label: effectiveGroupId == null ? '仅公共库' : '公共库 + 当前项目组私有库',
          publicLibrary: true,
          privateLibrary: effectiveGroupId != null,
          groupId: effectiveGroupId ?? null,
          groupName: activeGroup?.name ?? null,
          isolationNotice:
            effectiveGroupId == null
              ? isAdmin
                ? '当前为管理员视角，仅管理公共基础库，不加入项目组。'
                : '当前未进入项目组，仅可检索公共基础库。'
              : '当前仅检索本项目组私有资料，不跨项目组读取私有库。',
        },
        pipeline: ['范围过滤', '关键词召回', '语义召回', '融合重排', '阿里千问生成（目标）'],
        retrievalStats: {
          queryMode: 'featured-query-unavailable',
          tokenCount: 0,
          candidateChunks: 0,
          returnedCitations: 0,
          publicLibraryHits: 0,
          privateLibraryHits: 0,
        },
        ragMeta: {
          retrievalMode: 'hybrid',
          generationProviderTarget: 'Qwen',
          prototypeMode: 'chunk-indexed-prototype',
          answerTraceable: true,
        },
        answer: error.message,
        citations: [],
        explanation: '首页精选检索当前未执行，工作台其余数据仍可正常加载。',
      };
    }

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
      featuredQuery,
    };
  }
}
