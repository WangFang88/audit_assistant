import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { TeamEntity } from '../../database/entities/team.entity';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
declare class CreateGroupDto {
    name: string;
    organizationName: string;
}
declare class InviteMemberDto {
    phone: string;
    role: 'member' | 'leader';
}
declare class TransferLeaderDto {
    targetUserId: string;
}
declare class UpdateMemberRoleDto {
    role: 'member' | 'leader';
}
type GroupRecord = {
    id: string;
    name: string;
    organizationName: string;
    ownerUserId: string;
    memberCount: number;
    privateDocumentCount: number;
    lastQueryAt: string | null;
};
type MemberRecord = {
    id: string;
    groupId: string;
    userId: string;
    name: string;
    phone: string;
    role: 'leader' | 'member';
};
export declare class GroupsService {
    private readonly authService;
    private readonly subscriptionsService;
    private readonly teamRepository;
    private readonly teamMemberRepository;
    private readonly documentsService;
    private readonly chatService;
    private readonly teamAgentsService;
    constructor(authService: AuthService, subscriptionsService: SubscriptionsService, teamRepository: Repository<TeamEntity>, teamMemberRepository: Repository<TeamMemberEntity>, documentsService: DocumentsService, chatService: ChatService, teamAgentsService: TeamAgentsService);
    private toGroupRecord;
    private toMemberRecord;
    private ensureSeedData;
    persistState(): void;
    private assertAdminCannotManageGroups;
    private getCurrentUser;
    private isCurrentUserMemberOfGroup;
    assertCanAccessGroup(groupId: string): Promise<void>;
    listGroups(): Promise<GroupRecord[]>;
    getGroupById(groupId: string): Promise<GroupRecord>;
    createGroup(dto: CreateGroupDto): Promise<GroupRecord>;
    listMembers(groupId: string): Promise<MemberRecord[]>;
    updateMemberRole(groupId: string, memberId: string, dto: UpdateMemberRoleDto): Promise<{
        groupId: string;
        memberId: string;
        role: "member" | "leader";
    }>;
    invite(groupId: string, dto: InviteMemberDto): Promise<{
        groupId: string;
        phone: string;
        role: "member" | "leader";
        memberCount: number;
    }>;
    transferLeader(groupId: string, dto: TransferLeaderDto): Promise<{
        groupId: string;
        groupName: string;
        previousLeaderId: string;
        newLeaderId: string;
        transferredAt: string;
    }>;
    removeMember(groupId: string, memberId: string): Promise<{
        groupId: string;
        groupName: string;
        removedMemberId: string;
        removedUserId: string;
        removedAt: string;
        memberCount: number;
    }>;
    deleteGroup(groupId: string): Promise<{
        deletedGroupId: string;
        deletedGroupName: string;
        deletedAt: string;
        remainingGroups: number;
    }>;
}
export { CreateGroupDto, InviteMemberDto, TransferLeaderDto, UpdateMemberRoleDto };
