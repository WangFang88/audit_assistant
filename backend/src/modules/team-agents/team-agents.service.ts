import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';

type TeamAgentCapability =
  | 'query'
  | 'article_explanation'
  | 'case_reference'
  | 'working_paper_draft'
  | 'risk_check'
  | 'usage_stats'
  | 'config_management';

type TeamAgentRecord = {
  id: string;
  groupId: string;
  name: string;
  status: 'active' | 'deleted';
  capabilities: TeamAgentCapability[];
  createdAt: string;
  defaultConversationId: string | null;
  config: {
    retrievalScope: 'public_plus_group_private';
  };
};

@Injectable()
export class TeamAgentsService {
  constructor(
    private readonly localStateService: LocalStateService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
  ) {
    const persistedState = this.localStateService.readState();
    if (persistedState.teamAgents && persistedState.teamAgents.length > 0) {
      this.teamAgents.splice(
        0,
        this.teamAgents.length,
        ...persistedState.teamAgents.map((agent) => ({
          ...agent,
          capabilities: agent.capabilities.filter(this.isCapability),
        })),
      );
    }
  }

  private readonly teamAgents: TeamAgentRecord[] = [
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

  private isCapability = (value: string): value is TeamAgentCapability => {
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

  private persistState() {
    this.localStateService.saveTeamAgents(this.teamAgents);
  }

  private buildCreatedAt() {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  private assertCanAccessGroupAgent(groupId: string) {
    if (this.authService.isAdmin()) {
      throw new NotFoundException('管理员不参与项目组 Agent');
    }

    this.groupsService.assertCanAccessGroup(groupId);
  }

  createForGroup(group: { id: string; name: string }, defaultConversationId: string | null) {
    const existing = this.teamAgents.find((agent) => agent.groupId === group.id && agent.status === 'active');
    if (existing) {
      existing.name = `${group.name} Agent`;
      existing.defaultConversationId = defaultConversationId;
      this.persistState();
      return existing;
    }

    const agent: TeamAgentRecord = {
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

  getByGroupId(groupId: string) {
    const agent = this.teamAgents.find((item) => item.groupId === groupId && item.status === 'active');
    if (!agent) {
      throw new NotFoundException('当前项目组 Agent 不存在');
    }

    return agent;
  }

  getVisibleAgentByGroupId(groupId: string) {
    this.assertCanAccessGroupAgent(groupId);
    return this.getByGroupId(groupId);
  }

  resolveGroupId(agentId?: string, groupId?: string) {
    if (agentId == null || agentId.trim().length === 0) {
      return groupId;
    }

    const agent = this.teamAgents.find((item) => item.id === agentId && item.status === 'active');
    if (!agent) {
      throw new NotFoundException('项目组 Agent 不存在');
    }

    this.assertCanAccessGroupAgent(agent.groupId);
    if (groupId != null && groupId !== agent.groupId) {
      throw new NotFoundException('当前 Agent 不属于所选项目组');
    }

    return agent.groupId;
  }

  deleteByGroupId(groupId: string) {
    const nextAgents = this.teamAgents.filter((agent) => agent.groupId !== groupId);
    this.teamAgents.splice(0, this.teamAgents.length, ...nextAgents);
    this.persistState();
  }
}

export { TeamAgentCapability, TeamAgentRecord };
