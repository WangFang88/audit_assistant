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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const chat_service_1 = require("../chat/chat.service");
const documents_service_1 = require("../documents/documents.service");
const groups_service_1 = require("../groups/groups.service");
const query_service_1 = require("../query/query.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const team_agents_service_1 = require("../team-agents/team-agents.service");
let OverviewService = class OverviewService {
    constructor(authService, groupsService, documentsService, queryService, chatService, subscriptionsService, teamAgentsService) {
        this.authService = authService;
        this.groupsService = groupsService;
        this.documentsService = documentsService;
        this.queryService = queryService;
        this.chatService = chatService;
        this.subscriptionsService = subscriptionsService;
        this.teamAgentsService = teamAgentsService;
    }
    async getDashboard(groupId) {
        const user = this.authService.me();
        const isAdmin = user.role === 'admin';
        const visibleGroups = isAdmin ? [] : await this.groupsService.listGroups();
        const effectiveGroupId = isAdmin ? undefined : groupId ?? visibleGroups[0]?.id;
        const activeGroup = effectiveGroupId ? await this.groupsService.getGroupById(effectiveGroupId) : null;
        const activeTeamAgent = effectiveGroupId ? await this.teamAgentsService.getVisibleAgentByGroupId(effectiveGroupId) : null;
        let featuredQuery;
        try {
            featuredQuery = await this.queryService.search({
                question: '请检索与专项资金使用和采购审批相关的制度依据。',
                groupId: effectiveGroupId,
                agentId: activeTeamAgent?.id,
            });
        }
        catch (error) {
            if (!(error instanceof common_1.BadRequestException)) {
                throw error;
            }
            featuredQuery = {
                question: '请检索与专项资金使用和采购审批相关的制度依据。',
                agentMode: activeTeamAgent != null,
                agent: activeTeamAgent == null
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
                    isolationNotice: effectiveGroupId == null
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
                isolationNotice: effectiveGroupId == null
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
            documents: await this.documentsService.listDocuments(effectiveGroupId),
            extractJobs: this.documentsService.listExtractionJobs(effectiveGroupId),
            libraryScope: await this.documentsService.getLibraryScopeSummary(effectiveGroupId),
            subscription: this.subscriptionsService.getOverview(),
            conversations: isAdmin ? [] : await this.chatService.listConversations(effectiveGroupId),
            activeTeamAgent: activeTeamAgent == null
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
};
exports.OverviewService = OverviewService;
exports.OverviewService = OverviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        groups_service_1.GroupsService,
        documents_service_1.DocumentsService,
        query_service_1.QueryService,
        chat_service_1.ChatService,
        subscriptions_service_1.SubscriptionsService,
        team_agents_service_1.TeamAgentsService])
], OverviewService);
//# sourceMappingURL=overview.service.js.map