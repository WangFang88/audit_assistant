import { forwardRef, Inject, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsIn, IsString, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { TeamEntity } from '../../database/entities/team.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { formatCst } from '../../utils/date';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
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

class UpdateMemberRoleDto {
  @IsIn(['member', 'leader'])
  role!: 'member' | 'leader';
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
    private readonly auditService: AuditService,
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepository: Repository<TeamMemberEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => TeamAgentsService))
    private readonly teamAgentsService: TeamAgentsService,
  ) {}

  private toGroupRecord(entity: TeamEntity, memberCount: number, privateDocumentCount: number): GroupRecord {
    return {
      id: entity.id,
      name: entity.name,
      organizationName: entity.organizationName,
      ownerUserId: entity.ownerUserId,
      memberCount,
      privateDocumentCount,
      lastQueryAt: entity.lastQueryAt ? formatCst(entity.lastQueryAt, false) : null,
    };
  }

  private toMemberRecord(entity: TeamMemberEntity): MemberRecord {
    return {
      id: String(entity.id),
      groupId: entity.teamId,
      userId: entity.userId,
      name: entity.userId,
      phone: '',
      role: entity.role,
    };
  }

  private async ensureSeedData() {
    const count = await this.teamRepository.count();
    if (count > 0) {
      return;
    }

    await this.teamRepository.save(
      this.teamRepository.create({
        id: 'group-1',
        name: '某区财政局审计组',
        organizationName: '某区财政局',
        ownerUserId: 'user-2',
        lastQueryAt: new Date('2026-04-25T16:20:00'),
      }),
    );

    await this.teamMemberRepository.save([
      this.teamMemberRepository.create({ teamId: 'group-1', userId: 'user-2', role: 'leader' }),
      this.teamMemberRepository.create({ teamId: 'group-1', userId: 'user-3', role: 'member' }),
      this.teamMemberRepository.create({ teamId: 'group-1', userId: 'user-4', role: 'member' }),
    ]);

    const seedGroup = { id: 'group-1', name: '某区财政局审计组' };
    const conversation = await this.chatService.createAgentConversation(seedGroup);
    await this.chatService.syncGroupConversationParticipants('group-1', ['user-2', 'user-3', 'user-4']);
    await this.teamAgentsService.createForGroup(seedGroup, conversation.id);
  }

  persistState() {
    // no-op: state is now persisted in the database
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

  private async isCurrentUserMemberOfGroup(groupId: string) {
    const user = this.getCurrentUser();
    const member = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: user.id });
    return member != null;
  }

  async assertCanAccessGroup(groupId: string) {
    if (this.authService.isAdmin()) {
      throw new ForbiddenException('管理员不参与项目组，无法访问项目组相关数据');
    }

    await this.getGroupById(groupId);
    if (await this.isCurrentUserMemberOfGroup(groupId)) {
      return;
    }

    throw new ForbiddenException('当前账号不属于该项目组，无法访问相关数据');
  }

  async assertIsLeader(groupId: string) {
    await this.assertCanAccessGroup(groupId);
    const currentUser = this.getCurrentUser();
    const member = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
    if (member?.role !== 'leader') {
      throw new ForbiddenException('只有组长才能执行此操作');
    }
  }

  async listGroups() {
    if (this.authService.isAdmin()) {
      return [];
    }

    await this.ensureSeedData();
    const currentUserId = this.getCurrentUser().id;
    const memberships = await this.teamMemberRepository.findBy({ userId: currentUserId });
    const groupIds = memberships.map((m) => m.teamId);
    if (groupIds.length === 0) {
      return [];
    }

    const teams = await this.teamRepository.findByIds(groupIds);
    return Promise.all(
      teams.map(async (team) => {
        const [memberCount, privateDocumentCount] = await Promise.all([
          this.teamMemberRepository.countBy({ teamId: team.id }),
          this.documentsService.countPrivateDocuments([team.id]),
        ]);
        return this.toGroupRecord(team, memberCount, privateDocumentCount);
      }),
    );
  }

  async getGroupById(groupId: string) {
    await this.ensureSeedData();
    const team = await this.teamRepository.findOneBy({ id: groupId });
    if (!team) {
      throw new NotFoundException('项目组不存在');
    }

    const memberCount = await this.teamMemberRepository.countBy({ teamId: groupId });
    return this.toGroupRecord(team, memberCount, 0);
  }

  async createGroup(dto: CreateGroupDto) {
    this.assertAdminCannotManageGroups();
    const currentUser = this.getCurrentUser();
    const existingGroups = await this.listGroups();
    await this.subscriptionsService.assertCanCreateGroup(existingGroups.length);

    const groupId = `group-${Date.now()}`;
    await this.teamRepository.save(
      this.teamRepository.create({
        id: groupId,
        name: dto.name,
        organizationName: dto.organizationName,
        ownerUserId: currentUser.id,
        lastQueryAt: null,
      }),
    );
    await this.teamMemberRepository.save(
      this.teamMemberRepository.create({ teamId: groupId, userId: currentUser.id, role: 'leader' }),
    );

    const group = await this.getGroupById(groupId);
    const conversation = await this.chatService.createAgentConversation(group);
    await this.chatService.syncGroupConversationParticipants(groupId, [currentUser.id]);
    await this.teamAgentsService.createForGroup(group, conversation.id);
    this.subscriptionsService.syncUsage({ groups: existingGroups.length + 1 });
    await this.auditService.recordEvent({
      eventType: 'group.create',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      targetType: 'group',
      targetId: group.id,
      groupId: group.id,
      summary: '创建了项目组',
      detail: { groupName: group.name, organizationName: group.organizationName },
    });

    return group;
  }

  async listMembers(groupId: string) {
    this.assertAdminCannotManageGroups();
    await this.assertCanAccessGroup(groupId);
    const members = await this.teamMemberRepository.findBy({ teamId: groupId });
    const userIds = members.map((m) => m.userId);
    const users = userIds.length > 0 ? await this.userRepository.findByIds(userIds) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));
    return members.map((m) => {
      const user = userMap.get(m.userId);
      return {
        id: String(m.id),
        groupId: m.teamId,
        userId: m.userId,
        name: user?.nickname ?? m.userId,
        phone: user?.phone ?? '',
        role: m.role,
      };
    });
  }

  async updateMemberRole(groupId: string, memberId: string, dto: UpdateMemberRoleDto) {
    this.assertAdminCannotManageGroups();
    await this.assertCanAccessGroup(groupId);

    const currentUser = this.getCurrentUser();
    const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
    if (currentMember?.role !== 'leader') {
      throw new ForbiddenException('只有组长才能修改成员角色');
    }

    const target = await this.teamMemberRepository.findOneBy({ teamId: groupId, id: Number(memberId) });
    if (!target) {
      throw new NotFoundException('成员不存在');
    }

    await this.teamMemberRepository.update({ id: Number(memberId) }, { role: dto.role });
    return { groupId, memberId, role: dto.role };
  }

  async invite(groupId: string, dto: InviteMemberDto) {
    this.assertAdminCannotManageGroups();
    await this.assertCanAccessGroup(groupId);

    const targetUser = this.authService.getUserByPhone(dto.phone);
    if (!targetUser) {
      throw new NotFoundException('该手机号未注册');
    }

    const existing = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: targetUser.id });
    if (existing) {
      throw new BadRequestException('该用户已是项目组成员');
    }

    await this.teamMemberRepository.save(
      this.teamMemberRepository.create({ teamId: groupId, userId: targetUser.id, role: dto.role }),
    );
    await this.chatService.syncGroupConversationParticipants(groupId, [targetUser.id]);

    const currentUser = this.getCurrentUser();
    const members = await this.teamMemberRepository.findBy({ teamId: groupId });
    await this.auditService.recordEvent({
      eventType: 'group.invite_member',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      targetType: 'group-member',
      targetId: targetUser.id,
      groupId,
      summary: '邀请了项目组成员',
      detail: { phone: dto.phone, role: dto.role, invitedUserId: targetUser.id },
    });
    return {
      groupId,
      phone: dto.phone,
      role: dto.role,
      memberCount: members.length,
    };
  }

  async transferLeader(groupId: string, dto: TransferLeaderDto) {
    this.assertAdminCannotManageGroups();
    await this.assertCanAccessGroup(groupId);

    const currentUser = this.getCurrentUser();
    const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
    if (currentMember?.role !== 'leader') {
      throw new ForbiddenException('只有组长才能移交组长权限');
    }

    const group = await this.getGroupById(groupId);

    const newLeader = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: dto.targetUserId });
    if (!newLeader) {
      throw new NotFoundException('目标成员不存在');
    }

    // 检查新组长已拥有的项目组数量是否超出其套餐限制
    const newLeaderGroupCount = await this.teamRepository.countBy({ ownerUserId: dto.targetUserId });
    const newLeaderGroupLimit = await this.subscriptionsService.getGroupLimitForUser(dto.targetUserId);
    if (newLeaderGroupCount >= newLeaderGroupLimit) {
      throw new BadRequestException('该成员当前套餐已达项目组上限，无法接受组长移交');
    }

    const previousLeaderId = group.ownerUserId;
    await this.teamMemberRepository.update({ teamId: groupId, userId: group.ownerUserId }, { role: 'member' });
    await this.teamMemberRepository.update({ teamId: groupId, userId: dto.targetUserId }, { role: 'leader' });
    await this.teamRepository.update({ id: groupId }, { ownerUserId: dto.targetUserId });
    await this.auditService.recordEvent({
      eventType: 'group.transfer_leader',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      targetType: 'group',
      targetId: groupId,
      groupId,
      summary: '移交了项目组组长权限',
      detail: { previousLeaderId, newLeaderId: dto.targetUserId, groupName: group.name },
    });

    return {
      groupId,
      groupName: group.name,
      previousLeaderId,
      newLeaderId: dto.targetUserId,
      transferredAt: formatCst(new Date(), false),
    };
  }

  async removeMember(groupId: string, memberId: string) {
    this.assertAdminCannotManageGroups();
    const group = await this.getGroupById(groupId);
    await this.assertCanAccessGroup(groupId);

    const currentUser = this.getCurrentUser();
    const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
    const member = await this.teamMemberRepository.findOneBy({ id: Number(memberId), teamId: groupId });
    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    const isSelfExit = member.userId === currentUser.id;
    if (isSelfExit) {
      if (member.role === 'leader') {
        throw new BadRequestException('组长请先移交组长身份后再退出项目组');
      }
    } else {
      if (currentMember?.role !== 'leader') {
        throw new ForbiddenException('只有组长才能清退组员');
      }
      if (member.role === 'leader') {
        throw new BadRequestException('请先移交组长后再清退当前组长');
      }
    }

    await this.teamMemberRepository.delete({ id: Number(memberId) });
    await this.chatService.removeUserFromGroupConversations(groupId, member.userId);
    const memberCount = await this.teamMemberRepository.countBy({ teamId: groupId });
    await this.auditService.recordEvent({
      eventType: isSelfExit ? 'group.quit' : 'group.remove_member',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      targetType: 'group-member',
      targetId: member.userId,
      groupId,
      summary: isSelfExit ? '退出了项目组' : '清退了项目组成员',
      detail: { removedUserId: member.userId, removedRole: member.role, groupName: group.name },
    });

    return {
      groupId,
      groupName: group.name,
      removedMemberId: memberId,
      removedUserId: member.userId,
      removedAt: formatCst(new Date(), false),
      memberCount,
      action: isSelfExit ? 'quit' : 'remove',
    };
  }

  async deleteGroup(groupId: string) {
    this.assertAdminCannotManageGroups();
    await this.assertCanAccessGroup(groupId);

    const currentUser = this.getCurrentUser();
    const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
    if (currentMember?.role !== 'leader') {
      throw new ForbiddenException('只有组长才能删除项目组');
    }

    const group = await this.getGroupById(groupId);

    await this.teamMemberRepository.delete({ teamId: groupId });
    this.documentsService.removeGroupDocuments(groupId);
    await this.chatService.removeGroupConversations(groupId);
    await this.teamAgentsService.deleteByGroupId(groupId);
    await this.teamRepository.delete({ id: groupId });

    const remainingGroups = await this.listGroups();
    this.subscriptionsService.syncUsage({ groups: remainingGroups.length });
    await this.auditService.recordEvent({
      eventType: 'group.delete',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      targetType: 'group',
      targetId: group.id,
      groupId: group.id,
      summary: '删除了项目组',
      detail: { groupName: group.name, remainingGroups: remainingGroups.length },
    });

    return {
      deletedGroupId: group.id,
      deletedGroupName: group.name,
      deletedAt: formatCst(new Date(), false),
      remainingGroups: remainingGroups.length,
    };
  }
}

export { CreateGroupDto, InviteMemberDto, TransferLeaderDto, UpdateMemberRoleDto };
