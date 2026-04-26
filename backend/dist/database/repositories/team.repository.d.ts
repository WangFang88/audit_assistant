import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';
export type TeamSnapshot = {
    id: string;
    name: string;
    organizationName: string;
    ownerUserId: string;
    memberCount: number;
    privateDocumentCount: number;
    lastQueryAt: string | null;
};
export type TeamMemberSnapshot = {
    id: string;
    groupId: string;
    userId: string;
    name: string;
    phone: string;
    role: 'leader' | 'member';
};
export declare class TeamRepository {
    mapTeamEntity(entity: TeamEntity, memberCount: number, privateDocumentCount: number): TeamSnapshot;
    createTeamEntity(snapshot: TeamSnapshot): TeamEntity;
    createTeamMemberEntity(snapshot: TeamMemberSnapshot): TeamMemberEntity;
    private formatDateTime;
}
