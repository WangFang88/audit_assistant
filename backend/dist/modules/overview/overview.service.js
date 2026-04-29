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
const audit_service_1 = require("../audit/audit.service");
const auth_service_1 = require("../auth/auth.service");
const chat_service_1 = require("../chat/chat.service");
const documents_service_1 = require("../documents/documents.service");
const groups_service_1 = require("../groups/groups.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const team_agents_service_1 = require("../team-agents/team-agents.service");
let OverviewService = class OverviewService {
    constructor(authService, groupsService, documentsService, chatService, subscriptionsService, teamAgentsService, auditService) {
        this.authService = authService;
        this.groupsService = groupsService;
        this.documentsService = documentsService;
        this.chatService = chatService;
        this.subscriptionsService = subscriptionsService;
        this.teamAgentsService = teamAgentsService;
        this.auditService = auditService;
    }
    async getDashboard(groupId) {
        const user = this.authService.me();
        const isAdmin = user.role === 'admin';
        const visibleGroups = isAdmin ? [] : await this.groupsService.listGroups();
        const effectiveGroupId = isAdmin ? undefined : groupId ?? visibleGroups[0]?.id;
        const [activeGroup, activeTeamAgent, members, documents, extractJobs, libraryScope, privateDocCount, recentAuditEvents, conversations] = await Promise.all([
            effectiveGroupId ? this.groupsService.getGroupById(effectiveGroupId) : Promise.resolve(null),
            effectiveGroupId ? this.teamAgentsService.getVisibleAgentByGroupId(effectiveGroupId) : Promise.resolve(null),
            effectiveGroupId ? this.groupsService.listMembers(effectiveGroupId) : Promise.resolve([]),
            this.documentsService.listDocuments(effectiveGroupId),
            this.documentsService.listExtractionJobs(effectiveGroupId),
            this.documentsService.getLibraryScopeSummary(effectiveGroupId),
            this.documentsService.countPrivateDocuments(visibleGroups.map((g) => g.id)),
            this.auditService.listRecentEvents(),
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
                isolationNotice: effectiveGroupId == null
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
            featuredQuery: null,
        };
    }
};
exports.OverviewService = OverviewService;
exports.OverviewService = OverviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        groups_service_1.GroupsService,
        documents_service_1.DocumentsService,
        chat_service_1.ChatService,
        subscriptions_service_1.SubscriptionsService,
        team_agents_service_1.TeamAgentsService,
        audit_service_1.AuditService])
], OverviewService);
//# sourceMappingURL=overview.service.js.map