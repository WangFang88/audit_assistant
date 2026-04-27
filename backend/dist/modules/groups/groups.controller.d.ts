import { CreateGroupDto, GroupsService, InviteMemberDto, TransferLeaderDto } from './groups.service';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    listGroups(): Promise<{
        id: string;
        name: string;
        organizationName: string;
        ownerUserId: string;
        memberCount: number;
        privateDocumentCount: number;
        lastQueryAt: string | null;
    }[]>;
    createGroup(dto: CreateGroupDto): Promise<{
        id: string;
        name: string;
        organizationName: string;
        ownerUserId: string;
        memberCount: number;
        privateDocumentCount: number;
        lastQueryAt: string | null;
    }>;
    listMembers(groupId: string): Promise<{
        id: string;
        groupId: string;
        userId: string;
        name: string;
        phone: string;
        role: "leader" | "member";
    }[]>;
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
