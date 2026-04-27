import { forwardRef, Inject, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IsIn, IsString, MinLength } from 'class-validator';
import { TeamMemberSnapshot, TeamRepository, TeamSnapshot } from '../../database/repositories/team.repository';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
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
    private readonly teamRepository: TeamRepository,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => TeamAgentsService))
    private readonly teamAgentsService: TeamAgentsService,
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
      ownerUserId: 'user-2',
      memberCount: 3,
      privateDocumentCount: 2,
      lastQueryAt: '2026-04-25 16:20',
    },
  ];

  private readonly members: MemberRecord[] = [
    {
      id: 'member-1',
      groupId: 'group-1',
      userId: 'user-2',
      name: '审计组长',
      phone: '13800138001',
      role: 'leader',
    },
    {
      id: 'member-2',
      groupId: 'group-1',
      userId: 'user-3',
      name: '审计助理',
      phone: '13800138002',
      role: 'member',
    },
    {
      id: 'member-3',
      groupId: 'group-1',
      userId: 'user-4',
      name: '法规顾问',
      phone: '13800138003',
      role: 'member',
    },
  ];

  private toTeamSnapshot(group: GroupRecord): TeamSnapshot {
    return {
      id: group.id,
      name: group.name,
      organizationName: group.organizationName,
      ownerUserId: group.ownerUserId,
      memberCount: group.memberCount,
      privateDocumentCount: group.privateDocumentCount,
      lastQueryAt: group.lastQueryAt,
    };
  }

  private toMemberSnapshot(member: MemberRecord): TeamMemberSnapshot {
    return {
      id: member.id,
      groupId: member.groupId,
      userId: member.userId,
      name: member.name,
      phone: member.phone,
      role: member.role,
    };
  }

  persistState() {
    this.localStateService.saveGroups(
      this.groups.map((group) => {
        const teamEntity = this.teamRepository.createTeamEntity(this.toTeamSnapshot(group));
        return this.teamRepository.mapTeamEntity(teamEntity, group.memberCount, group.privateDocumentCount);
      }),
      this.members.map((member) => {
        this.teamRepository.createTeamMemberEntity(this.toMemberSnapshot(member));
        return member;
      }),
    );
  }

  private assertAdminCannotManageGroups() {
    if (!this.authService.isAdmin()) {
      return;
    }

    throw new ForbiddenException('管理员不参与项目组，无法执行项目组相关操作');
  }

  private getCurrentUser() {
    return this.authService.me();
  }

  private isCurrentUserMemberOfGroup(groupId: string) {
    const user = this.getCurrentUser();
    return this.members.some((member) => member.groupId === groupId && member.userId === user.id);
  }

  assertCanAccessGroup(groupId: string) {
    if (this.authService.isAdmin()) {
      throw new ForbiddenException('管理员不参与项目组，无法访问项目组相关数据');
    }

    this.getGroupById(groupId);
    if (this.isCurrentUserMemberOfGroup(groupId)) {
      return;
    }

    throw new ForbiddenException('当前账号不属于该项目组，无法访问相关数据');
  }

  listGroups() {
    if (this.authService.isAdmin()) {
      return [];
    }

    const currentUserId = this.getCurrentUser().id;
    const memberGroupIds = new Set(
      this.members.filter((member) => member.userId === currentUserId).map((member) => member.groupId),
    );
    return this.groups.filter((group) => memberGroupIds.has(group.id));
  }

  getGroupById(groupId: string) {
    const group = this.groups.find((item) => item.id === groupId);
    if (!group) {
      throw new NotFoundException('项目组不存在');
    }

    return group;
  }

  async createGroup(dto: CreateGroupDto) {
    this.assertAdminCannotManageGroups();
    const currentUser = this.getCurrentUser();
    this.subscriptionsService.assertCanCreateGroup(this.listGroups().length);

    const group = {
      id: `group-${this.groups.length + 1}`,
      name: dto.name,
      organizationName: dto.organizationName,
      ownerUserId: currentUser.id,
      memberCount: 1,
      privateDocumentCount: 0,
      lastQueryAt: null,
    };

    this.groups.push(group);
    this.members.push({
      id: `member-${this.members.length + 1}`,
      groupId: group.id,
      userId: currentUser.id,
      name: currentUser.name,
      phone: currentUser.phone,
      role: 'leader',
    });

    const conversation = await this.chatService.createAgentConversation(group);
    await this.chatService.syncGroupConversationParticipants(group.id, [currentUser.id]);
    await this.teamAgentsService.createForGroup(group, conversation.id);
    this.persistState();
    this.subscriptionsService.syncUsage({ groups: this.groups.length });

    return group;
  }

  listMembers(groupId: string) {
    this.assertAdminCannotManageGroups();
    this.assertCanAccessGroup(groupId);
    return this.members.filter((member) => member.groupId === groupId);
  }

  invite(groupId: string, dto: InviteMemberDto) {
    this.assertAdminCannotManageGroups();
    this.assertCanAccessGroup(groupId);
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
    this.assertCanAccessGroup(groupId);
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

  async removeMember(groupId: string, memberId: string) {
    this.assertAdminCannotManageGroups();
    const group = this.getGroupById(groupId);
    this.assertCanAccessGroup(groupId);
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
    group.memberCount = this.members.filter((item) => item.groupId === groupId).length;
    await this.chatService.removeUserFromGroupConversations(groupId, member.userId);
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

  async deleteGroup(groupId: string) {
    this.assertAdminCannotManageGroups();
    this.assertCanAccessGroup(groupId);
    const groupIndex = this.groups.findIndex((group) => group.id === groupId);
    if (groupIndex < 0) {
      throw new NotFoundException('项目组不存在');
    }

    const group = this.groups[groupIndex];
    this.groups.splice(groupIndex, 1);
    this.members.splice(
      0,
      this.members.length,
      ...this.members.filter((member) => member.groupId !== groupId),
    );
    this.documentsService.removeGroupDocuments(groupId);
    await this.chatService.removeGroupConversations(groupId);
    await this.teamAgentsService.deleteByGroupId(groupId);
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
