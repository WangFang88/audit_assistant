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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_agent_entity_1 = require("../../database/entities/team-agent.entity");
const auth_service_1 = require("../auth/auth.service");
const groups_service_1 = require("../groups/groups.service");
let TeamAgentsService = class TeamAgentsService {
    constructor(teamAgentRepository, authService, groupsService) {
        this.teamAgentRepository = teamAgentRepository;
        this.authService = authService;
        this.groupsService = groupsService;
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
    }
    toRecord(entity) {
        return {
            id: entity.id,
            groupId: entity.teamId,
            name: entity.name,
            status: entity.status,
            capabilities: entity.capabilities.filter(this.isCapability),
            createdAt: entity.createdAt.toISOString().slice(0, 16).replace('T', ' '),
            defaultConversationId: entity.defaultConversationId,
            config: {
                retrievalScope: 'public_plus_group_private',
            },
        };
    }
    async assertCanAccessGroupAgent(groupId) {
        if (this.authService.isAdmin()) {
            throw new common_1.NotFoundException('管理员不参与项目组 Agent');
        }
        await this.groupsService.assertCanAccessGroup(groupId);
    }
    async createForGroup(group, defaultConversationId) {
        const existing = await this.teamAgentRepository.findOneBy({ teamId: group.id, status: 'active' });
        if (existing) {
            existing.name = `${group.name} Agent`;
            existing.defaultConversationId = defaultConversationId;
            const saved = await this.teamAgentRepository.save(existing);
            return this.toRecord(saved);
        }
        const agent = this.teamAgentRepository.create({
            id: `team-agent-${group.id}`,
            teamId: group.id,
            name: `${group.name} Agent`,
            status: 'active',
            capabilities: ['query', 'article_explanation'],
            retrievalScope: 'public_plus_group_private',
            defaultConversationId,
            deletedAt: null,
        });
        const saved = await this.teamAgentRepository.save(agent);
        return this.toRecord(saved);
    }
    async getByGroupId(groupId) {
        const agent = await this.teamAgentRepository.findOneBy({ teamId: groupId, status: 'active' });
        if (!agent) {
            throw new common_1.NotFoundException('当前项目组 Agent 不存在');
        }
        return this.toRecord(agent);
    }
    async getVisibleAgentByGroupId(groupId) {
        this.assertCanAccessGroupAgent(groupId);
        return this.getByGroupId(groupId);
    }
    async resolveGroupId(agentId, groupId) {
        if (agentId == null || agentId.trim().length === 0) {
            return groupId;
        }
        const agent = await this.teamAgentRepository.findOneBy({ id: agentId, status: 'active' });
        if (!agent) {
            throw new common_1.NotFoundException('项目组 Agent 不存在');
        }
        this.assertCanAccessGroupAgent(agent.teamId);
        if (groupId != null && groupId !== agent.teamId) {
            throw new common_1.NotFoundException('当前 Agent 不属于所选项目组');
        }
        return agent.teamId;
    }
    async deleteByGroupId(groupId) {
        await this.teamAgentRepository.delete({ teamId: groupId });
    }
};
exports.TeamAgentsService = TeamAgentsService;
exports.TeamAgentsService = TeamAgentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(team_agent_entity_1.TeamAgentEntity)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => groups_service_1.GroupsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        auth_service_1.AuthService,
        groups_service_1.GroupsService])
], TeamAgentsService);
//# sourceMappingURL=team-agents.service.js.map