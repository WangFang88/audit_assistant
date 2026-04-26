import { Repository } from 'typeorm';
import { TeamAgentEntity } from '../../database/entities/team-agent.entity';
import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
type TeamAgentCapability = 'query' | 'article_explanation' | 'case_reference' | 'working_paper_draft' | 'risk_check' | 'usage_stats' | 'config_management';
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
export declare class TeamAgentsService {
    private readonly teamAgentRepository;
    private readonly authService;
    private readonly groupsService;
    constructor(teamAgentRepository: Repository<TeamAgentEntity>, authService: AuthService, groupsService: GroupsService);
    private isCapability;
    private toRecord;
    private assertCanAccessGroupAgent;
    createForGroup(group: {
        id: string;
        name: string;
    }, defaultConversationId: string | null): Promise<TeamAgentRecord>;
    getByGroupId(groupId: string): Promise<TeamAgentRecord>;
    getVisibleAgentByGroupId(groupId: string): Promise<TeamAgentRecord>;
    resolveGroupId(agentId?: string, groupId?: string): Promise<string | undefined>;
    deleteByGroupId(groupId: string): Promise<void>;
}
export { TeamAgentCapability, TeamAgentRecord };
