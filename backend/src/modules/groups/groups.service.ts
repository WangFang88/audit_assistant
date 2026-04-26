import { forwardRef, Inject, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IsIn, IsString, MinLength } from 'class-validator';
import { AuthService } from '../auth/auth.service';
import { DocumentsService } from '../documents/documents.service';
import { LocalStateService } from '../subscriptions/local-state.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

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
  constructor(
    private readonly authService: AuthService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly localStateService: LocalStateService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
  ) {
    const persistedState = this.localStateService.readState();
    if (persistedState.groups) {
      this.groups.splice(0, this.groups.length, ...persistedState.groups);
    }
    if (persistedState.members) {
      this.members.splice(0, this.members.length, ...persistedState.members);
    }
  }

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

  private assertAdminCannotManageGroups() {
    if (!this.authService.isAdmin()) {
      return;
    }

    throw new ForbiddenException('管理员不参与项目组，无法执行项目组相关操作');
  }

  listGroups() {
    return this.groups;
  }

  persistState() {
    this.localStateService.saveGroups(this.groups, this.members);
  }

  getGroupById(groupId: string) {
    const group = this.groups.find((item) => item.id === groupId);
    if (!group) {
      throw new NotFoundException('项目组不存在');
    }

    return group;
  }

  createGroup(dto: CreateGroupDto) {
    this.assertAdminCannotManageGroups();
    this.subscriptionsService.assertCanCreateGroup(this.groups.length);

    const group = {
      id: `group-${this.groups.length + 1}`,
      name: dto.name,
      organizationName: dto.organizationName,
      ownerUserId: 'user-1',
      memberCount: 1,
      privateDocumentCount: 0,
      lastQueryAt: null,
    };

    this.groups.push(group);
    this.members.push({
      id: `member-${this.members.length + 1}`,
      groupId: group.id,
      userId: 'user-1',
      name: '审计专员',
      phone: '13800138000',
      role: 'leader',
    });
    this.persistState();
    this.subscriptionsService.syncUsage({ groups: this.groups.length });

    return group;
  }

  listMembers(groupId: string) {
    this.assertAdminCannotManageGroups();
    this.getGroupById(groupId);
    return this.members.filter((member) => member.groupId === groupId);
  }

  invite(groupId: string, dto: InviteMemberDto) {
    this.assertAdminCannotManageGroups();
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
    this.assertAdminCannotManageGroups();
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
    this.persistState();

    return {
      groupId,
      groupName: group.name,
      previousLeaderId,
      newLeaderId: dto.targetUserId,
      transferredAt: '2026-04-25 18:00',
    };
  }

  removeMember(groupId: string, memberId: string) {
    this.assertAdminCannotManageGroups();
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
    this.persistState();

    return {
      groupId,
      groupName: group.name,
      removedMemberId: member.id,
      removedUserId: member.userId,
      removedAt: '2026-04-25 18:20',
      memberCount: group.memberCount,
    };
  }

  deleteGroup(groupId: string) {
    this.assertAdminCannotManageGroups();
    const groupIndex = this.groups.findIndex((group) => group.id === groupId);
    if (groupIndex < 0) {
      throw new NotFoundException('项目组不存在');
    }

    if (this.groups.length <= 1) {
      throw new BadRequestException('至少需要保留 1 个项目组，暂不支持删除最后一个项目组');
    }

    const group = this.groups[groupIndex];
    this.groups.splice(groupIndex, 1);
    this.members.splice(
      0,
      this.members.length,
      ...this.members.filter((member) => member.groupId !== groupId),
    );
    this.documentsService.removeGroupDocuments(groupId);
    this.persistState();
    this.subscriptionsService.syncUsage({ groups: this.groups.length });

    return {
      deletedGroupId: group.id,
      deletedGroupName: group.name,
      deletedAt: '2026-04-26 13:10',
      remainingGroups: this.groups.length,
    };
  }
}

export { CreateGroupDto, InviteMemberDto, TransferLeaderDto };
