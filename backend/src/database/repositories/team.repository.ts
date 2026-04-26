import { Injectable } from '@nestjs/common';
import { TeamEntity } from '../entities/team.entity';
import { TeamMemberEntity } from '../entities/team-member.entity';

export type TeamSnapshot = {
  id: string;
  name: string;
  organizationName: string;
  ownerUserId: string;
  memberCount: number;
  privateDocumentCount: number;
  lastQueryAt: string | null;
};

export type TeamMemberSnapshot = {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  phone: string;
  role: 'leader' | 'member';
};

@Injectable()
export class TeamRepository {
  mapTeamEntity(entity: TeamEntity, memberCount: number, privateDocumentCount: number): TeamSnapshot {
    return {
      id: entity.id,
      name: entity.name,
      organizationName: entity.organizationName,
      ownerUserId: entity.ownerUserId,
      memberCount,
      privateDocumentCount,
      lastQueryAt: entity.lastQueryAt ? this.formatDateTime(entity.lastQueryAt) : null,
    };
  }

  createTeamEntity(snapshot: TeamSnapshot): TeamEntity {
    const entity = new TeamEntity();
    entity.id = snapshot.id;
    entity.name = snapshot.name;
    entity.organizationName = snapshot.organizationName;
    entity.ownerUserId = snapshot.ownerUserId;
    entity.lastQueryAt = snapshot.lastQueryAt ? new Date(snapshot.lastQueryAt.replace(' ', 'T')) : null;
    return entity;
  }

  createTeamMemberEntity(snapshot: TeamMemberSnapshot): TeamMemberEntity {
    const entity = new TeamMemberEntity();
    entity.teamId = snapshot.groupId;
    entity.userId = snapshot.userId;
    entity.role = snapshot.role;
    return entity;
  }

  private formatDateTime(date: Date) {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}
