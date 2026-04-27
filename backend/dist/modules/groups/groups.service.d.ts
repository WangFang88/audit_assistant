import { TeamRepository } from '../../database/repositories/team.repository';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
import { LocalStateService } from '../subscriptions/local-state.service';
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
    private readonly localStateService;
    private readonly teamRepository;
    private readonly documentsService;
    private readonly chatService;
    private readonly teamAgentsService;
    constructor(authService: AuthService, subscriptionsService: SubscriptionsService, localStateService: LocalStateService, teamRepository: TeamRepository, documentsService: DocumentsService, chatService: ChatService, teamAgentsService: TeamAgentsService);
    private readonly groups;
    private readonly members;
    private toTeamSnapshot;
    private toMemberSnapshot;
    persistState(): void;
    private assertAdminCannotManageGroups;
    private getCurrentUser;
    private isCurrentUserMemberOfGroup;
    assertCanAccessGroup(groupId: string): void;
    listGroups(): GroupRecord[];
    getGroupById(groupId: string): GroupRecord;
    createGroup(dto: CreateGroupDto): Promise<{
        id: string;
        name: string;
        organizationName: string;
        ownerUserId: string;
        memberCount: number;
        privateDocumentCount: number;
        lastQueryAt: null;
    }>;
    listMembers(groupId: string): MemberRecord[];
    invite(groupId: string, dto: InviteMemberDto): {
        groupId: string;
        inviteCode: string;
        phone: string;
        role: "member" | "leader";
        expiresAt: string;
    };
    transferLeader(groupId: string, dto: TransferLeaderDto): {
        groupId: string;
        groupName: string;
        previousLeaderId: string;
        newLeaderId: string;
        transferredAt: string;
    };
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
export { CreateGroupDto, InviteMemberDto, TransferLeaderDto };
