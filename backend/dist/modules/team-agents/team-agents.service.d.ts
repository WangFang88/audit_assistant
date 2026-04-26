import { AuthService } from '../auth/auth.service';
import { GroupsService } from '../groups/groups.service';
import { LocalStateService } from '../subscriptions/local-state.service';
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
    private readonly localStateService;
    private readonly authService;
    private readonly groupsService;
    constructor(localStateService: LocalStateService, authService: AuthService, groupsService: GroupsService);
    private readonly teamAgents;
    private isCapability;
    private persistState;
    private buildCreatedAt;
    private assertCanAccessGroupAgent;
    createForGroup(group: {
        id: string;
        name: string;
    }, defaultConversationId: string | null): TeamAgentRecord;
    getByGroupId(groupId: string): TeamAgentRecord;
    getVisibleAgentByGroupId(groupId: string): TeamAgentRecord;
    resolveGroupId(agentId?: string, groupId?: string): string | undefined;
    deleteByGroupId(groupId: string): void;
}
export { TeamAgentCapability, TeamAgentRecord };
