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
exports.TeamAgentsService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const groups_service_1 = require("../groups/groups.service");
const local_state_service_1 = require("../subscriptions/local-state.service");
let TeamAgentsService = class TeamAgentsService {
    constructor(localStateService, authService, groupsService) {
        this.localStateService = localStateService;
        this.authService = authService;
        this.groupsService = groupsService;
        this.teamAgents = [
            {
                id: 'team-agent-group-1',
                groupId: 'group-1',
                name: '某区财政局审计组 Agent',
                status: 'active',
                capabilities: ['query', 'article_explanation'],
                createdAt: '2026-04-25 09:00',
                defaultConversationId: 'conv-agent-1',
                config: {
                    retrievalScope: 'public_plus_group_private',
                },
            },
        ];
        this.isCapability = (value) => {
            return [
                'query',
                'article_explanation',
                'case_reference',
                'working_paper_draft',
                'risk_check',
                'usage_stats',
                'config_management',
            ].includes(value);
        };
        const persistedState = this.localStateService.readState();
        if (persistedState.teamAgents && persistedState.teamAgents.length > 0) {
            this.teamAgents.splice(0, this.teamAgents.length, ...persistedState.teamAgents.map((agent) => ({
                ...agent,
                capabilities: agent.capabilities.filter(this.isCapability),
            })));
        }
    }
    persistState() {
        this.localStateService.saveTeamAgents(this.teamAgents);
    }
    buildCreatedAt() {
        return new Date().toISOString().slice(0, 16).replace('T', ' ');
    }
    assertCanAccessGroupAgent(groupId) {
        if (this.authService.isAdmin()) {
            throw new common_1.NotFoundException('管理员不参与项目组 Agent');
        }
        this.groupsService.assertCanAccessGroup(groupId);
    }
    createForGroup(group, defaultConversationId) {
        const existing = this.teamAgents.find((agent) => agent.groupId === group.id && agent.status === 'active');
        if (existing) {
            existing.name = `${group.name} Agent`;
            existing.defaultConversationId = defaultConversationId;
            this.persistState();
            return existing;
        }
        const agent = {
            id: `team-agent-${group.id}`,
            groupId: group.id,
            name: `${group.name} Agent`,
            status: 'active',
            capabilities: ['query', 'article_explanation'],
            createdAt: this.buildCreatedAt(),
            defaultConversationId,
            config: {
                retrievalScope: 'public_plus_group_private',
            },
        };
        this.teamAgents.push(agent);
        this.persistState();
        return agent;
    }
    getByGroupId(groupId) {
        const agent = this.teamAgents.find((item) => item.groupId === groupId && item.status === 'active');
        if (!agent) {
            throw new common_1.NotFoundException('当前项目组 Agent 不存在');
        }
        return agent;
    }
    getVisibleAgentByGroupId(groupId) {
        this.assertCanAccessGroupAgent(groupId);
        return this.getByGroupId(groupId);
    }
    resolveGroupId(agentId, groupId) {
        if (agentId == null || agentId.trim().length === 0) {
            return groupId;
        }
        const agent = this.teamAgents.find((item) => item.id === agentId && item.status === 'active');
        if (!agent) {
            throw new common_1.NotFoundException('项目组 Agent 不存在');
        }
        this.assertCanAccessGroupAgent(agent.groupId);
        if (groupId != null && groupId !== agent.groupId) {
            throw new common_1.NotFoundException('当前 Agent 不属于所选项目组');
        }
        return agent.groupId;
    }
    deleteByGroupId(groupId) {
        const nextAgents = this.teamAgents.filter((agent) => agent.groupId !== groupId);
        this.teamAgents.splice(0, this.teamAgents.length, ...nextAgents);
        this.persistState();
    }
};
exports.TeamAgentsService = TeamAgentsService;
exports.TeamAgentsService = TeamAgentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => groups_service_1.GroupsService))),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService,
        auth_service_1.AuthService,
        groups_service_1.GroupsService])
], TeamAgentsService);
//# sourceMappingURL=team-agents.service.js.map