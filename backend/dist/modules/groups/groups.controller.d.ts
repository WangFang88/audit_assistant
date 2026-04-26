import { CreateGroupDto, GroupsService, InviteMemberDto, TransferLeaderDto } from './groups.service';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    listGroups(): {
        id: string;
        name: string;
        organizationName: string;
        ownerUserId: string;
        memberCount: number;
        privateDocumentCount: number;
        lastQueryAt: string | null;
    }[];
    createGroup(dto: CreateGroupDto): {
        id: string;
        name: string;
        organizationName: string;
        ownerUserId: string;
        memberCount: number;
        privateDocumentCount: number;
        lastQueryAt: null;
    };
    listMembers(groupId: string): {
        id: string;
        groupId: string;
        userId: string;
        name: string;
        phone: string;
        role: "leader" | "member";
    }[];
    invite(groupId: string, dto: InviteMemberDto): {
        groupId: string;
        inviteCode: string;
        phone: string;
        role: "leader" | "member";
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
    deleteGroup(groupId: string): {
        deletedGroupId: string;
        deletedGroupName: string;
        deletedAt: string;
        remainingGroups: number;
    };
}
