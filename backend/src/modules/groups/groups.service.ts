import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IsIn, IsString, MinLength } from 'class-validator';

class CreateGroupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  organizationName!: string;
}

class InviteMemberDto {
  @IsString()
  phone!: string;

  @IsIn(['member', 'leader'])
  role!: 'member' | 'leader';
}

class TransferLeaderDto {
  @IsString()
  targetUserId!: string;
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

@Injectable()
export class GroupsService {
  private readonly groups: GroupRecord[] = [
    {
      id: 'group-1',
      name: '某区财政局审计组',
      organizationName: '某区财政局',
      ownerUserId: 'user-1',
      memberCount: 4,
      privateDocumentCount: 2,
      lastQueryAt: '2026-04-25 16:20',
    },
  ];

  private readonly members: MemberRecord[] = [
    {
      id: 'member-1',
      groupId: 'group-1',
      userId: 'user-1',
      name: '审计专员',
      phone: '13800138000',
      role: 'leader',
    },
    {
      id: 'member-2',
      groupId: 'group-1',
      userId: 'user-2',
      name: '审计助理',
      phone: '13800138001',
      role: 'member',
    },
    {
      id: 'member-3',
      groupId: 'group-1',
      userId: 'user-3',
      name: '法规顾问',
      phone: '13800138002',
      role: 'member',
    },
  ];

  listGroups() {
    return this.groups;
  }

  getGroupById(groupId: string) {
    const group = this.groups.find((item) => item.id === groupId);
    if (!group) {
      throw new NotFoundException('项目组不存在');
    }

    return group;
  }

  createGroup(dto: CreateGroupDto) {
    return {
      id: `group-${this.groups.length + 1}`,
      name: dto.name,
      organizationName: dto.organizationName,
      ownerUserId: 'user-1',
      memberCount: 1,
      privateDocumentCount: 0,
      lastQueryAt: null,
    };
  }

  listMembers(groupId: string) {
    this.getGroupById(groupId);
    return this.members.filter((member) => member.groupId === groupId);
  }

  invite(groupId: string, dto: InviteMemberDto) {
    this.getGroupById(groupId);
    return {
      groupId,
      inviteCode: 'INVITE-2026',
      phone: dto.phone,
      role: dto.role,
      expiresAt: '2026-04-30 23:59',
    };
  }

  transferLeader(groupId: string, dto: TransferLeaderDto) {
    const group = this.getGroupById(groupId);
    const currentLeader = this.members.find(
      (member) => member.groupId === groupId && member.userId === group.ownerUserId,
    );
    const newLeader = this.members.find(
      (member) => member.groupId === groupId && member.userId === dto.targetUserId,
    );

    if (!newLeader) {
      throw new NotFoundException('目标成员不存在');
    }

    const previousLeaderId = group.ownerUserId;
    if (currentLeader) {
      currentLeader.role = 'member';
    }
    newLeader.role = 'leader';
    group.ownerUserId = dto.targetUserId;

    return {
      groupId,
      groupName: group.name,
      previousLeaderId,
      newLeaderId: dto.targetUserId,
      transferredAt: '2026-04-25 18:00',
    };
  }

  removeMember(groupId: string, memberId: string) {
    const group = this.getGroupById(groupId);
    const memberIndex = this.members.findIndex(
      (member) => member.groupId === groupId && member.id === memberId,
    );

    if (memberIndex < 0) {
      throw new NotFoundException('成员不存在');
    }

    const member = this.members[memberIndex];
    if (member.role === 'leader') {
      throw new BadRequestException('请先移交组长后再清退当前组长');
    }

    this.members.splice(memberIndex, 1);
    group.memberCount = Math.max(1, group.memberCount - 1);

    return {
      groupId,
      groupName: group.name,
      removedMemberId: member.id,
      removedUserId: member.userId,
      removedAt: '2026-04-25 18:20',
      memberCount: group.memberCount,
    };
  }
}

export { CreateGroupDto, InviteMemberDto, TransferLeaderDto };
