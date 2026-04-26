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
    private readonly subscriptionsService;
    private readonly localStateService;
    constructor(subscriptionsService: SubscriptionsService, localStateService: LocalStateService);
    private readonly groups;
    private readonly members;
    listGroups(): GroupRecord[];
    persistState(): void;
    getGroupById(groupId: string): GroupRecord;
    createGroup(dto: CreateGroupDto): {
        id: string;
        name: string;
        organizationName: string;
        ownerUserId: string;
        memberCount: number;
        privateDocumentCount: number;
        lastQueryAt: null;
    };
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
    removeMember(groupId: string, memberId: string): {
        groupId: string;
        groupName: string;
        removedMemberId: string;
        removedUserId: string;
        removedAt: string;
        memberCount: number;
    };
}
export { CreateGroupDto, InviteMemberDto, TransferLeaderDto };
