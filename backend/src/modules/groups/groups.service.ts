import { Injectable } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';

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

  @IsString()
  role!: 'member' | 'leader';
}

class TransferLeaderDto {
  @IsString()
  targetUserId!: string;
}

@Injectable()
export class GroupsService {
  private readonly groups = [
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

  private readonly members = [
    { id: 'member-1', groupId: 'group-1', userId: 'user-1', name: '审计专员', role: 'leader' },
    { id: 'member-2', groupId: 'group-1', userId: 'user-2', name: '审计助理', role: 'member' },
    { id: 'member-3', groupId: 'group-1', userId: 'user-3', name: '法规顾问', role: 'member' },
  ];

  listGroups() {
    return this.groups;
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
    return this.members.filter((member) => member.groupId == groupId);
  }

  invite(groupId: string, dto: InviteMemberDto) {
    return {
      groupId,
      inviteCode: 'INVITE-2026',
      phone: dto.phone,
      role: dto.role,
      expiresAt: '2026-04-30 23:59',
    };
  }

  transferLeader(groupId: string, dto: TransferLeaderDto) {
    return {
      groupId,
      previousLeaderId: 'user-1',
      newLeaderId: dto.targetUserId,
      transferredAt: '2026-04-25 18:00',
    };
  }
}

export { CreateGroupDto, InviteMemberDto, TransferLeaderDto };
