import { forwardRef, Inject, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsIn, IsString, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { TeamMemberEntity } from '../../database/entities/team-member.entity';
import { TeamEntity } from '../../database/entities/team.entity';
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
    @InjectRepository(TeamEntity)
    private readonly teamRepository: Repository<TeamEntity>,
    @InjectRepository(TeamMemberEntity)
    private readonly teamMemberRepository: Repository<TeamMemberEntity>,
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
      lastQueryAt: entity.lastQueryAt ? entity.lastQueryAt.toISOString().slice(0, 16).replace('T', ' ') : null,
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
        const memberCount = await this.teamMemberRepository.countBy({ teamId: team.id });
        return this.toGroupRecord(team, memberCount, 0);
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
    this.subscriptionsService.assertCanCreateGroup(existingGroups.length);

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

    return group;
  }

  async listMembers(groupId: string) {
    this.assertAdminCannotManageGroups();
    await this.assertCanAccessGroup(groupId);
    const members = await this.teamMemberRepository.findBy({ teamId: groupId });
    return members.map((m) => this.toMemberRecord(m));
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

    const members = await this.teamMemberRepository.findBy({ teamId: groupId });
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

    const previousLeaderId = group.ownerUserId;
    await this.teamMemberRepository.update({ teamId: groupId, userId: group.ownerUserId }, { role: 'member' });
    await this.teamMemberRepository.update({ teamId: groupId, userId: dto.targetUserId }, { role: 'leader' });
    await this.teamRepository.update({ id: groupId }, { ownerUserId: dto.targetUserId });

    return {
      groupId,
      groupName: group.name,
      previousLeaderId,
      newLeaderId: dto.targetUserId,
      transferredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
  }

  async removeMember(groupId: string, memberId: string) {
    this.assertAdminCannotManageGroups();
    const group = await this.getGroupById(groupId);
    await this.assertCanAccessGroup(groupId);

    const member = await this.teamMemberRepository.findOneBy({ id: Number(memberId), teamId: groupId });
    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    if (member.role === 'leader') {
      throw new BadRequestException('请先移交组长后再清退当前组长');
    }

    await this.teamMemberRepository.delete({ id: Number(memberId) });
    await this.chatService.removeUserFromGroupConversations(groupId, member.userId);
    const memberCount = await this.teamMemberRepository.countBy({ teamId: groupId });

    return {
      groupId,
      groupName: group.name,
      removedMemberId: memberId,
      removedUserId: member.userId,
      removedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      memberCount,
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

    return {
      deletedGroupId: group.id,
      deletedGroupName: group.name,
      deletedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      remainingGroups: remainingGroups.length,
    };
  }
}

export { CreateGroupDto, InviteMemberDto, TransferLeaderDto, UpdateMemberRoleDto };
