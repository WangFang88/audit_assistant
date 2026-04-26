import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamAgentEntity } from '../../database/entities/team-agent.entity';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';

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
    @InjectRepository(TeamAgentEntity)
    private readonly teamAgentRepository: Repository<TeamAgentEntity>,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => GroupsService))
    private readonly groupsService: GroupsService,
  ) {}

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

  private toRecord(entity: TeamAgentEntity): TeamAgentRecord {
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

  private assertCanAccessGroupAgent(groupId: string) {
    if (this.authService.isAdmin()) {
      throw new NotFoundException('管理员不参与项目组 Agent');
    }

    this.groupsService.assertCanAccessGroup(groupId);
  }

  async createForGroup(group: { id: string; name: string }, defaultConversationId: string | null) {
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

  async getByGroupId(groupId: string) {
    const agent = await this.teamAgentRepository.findOneBy({ teamId: groupId, status: 'active' });
    if (!agent) {
      throw new NotFoundException('当前项目组 Agent 不存在');
    }

    return this.toRecord(agent);
  }

  async getVisibleAgentByGroupId(groupId: string) {
    this.assertCanAccessGroupAgent(groupId);
    return this.getByGroupId(groupId);
  }

  async resolveGroupId(agentId?: string, groupId?: string) {
    if (agentId == null || agentId.trim().length === 0) {
      return groupId;
    }

    const agent = await this.teamAgentRepository.findOneBy({ id: agentId, status: 'active' });
    if (!agent) {
      throw new NotFoundException('项目组 Agent 不存在');
    }

    this.assertCanAccessGroupAgent(agent.teamId);
    if (groupId != null && groupId !== agent.teamId) {
      throw new NotFoundException('当前 Agent 不属于所选项目组');
    }

    return agent.teamId;
  }

  async deleteByGroupId(groupId: string) {
    await this.teamAgentRepository.delete({ teamId: groupId });
  }
}

export { TeamAgentCapability, TeamAgentRecord };
