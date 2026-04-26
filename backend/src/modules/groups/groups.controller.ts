import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  CreateGroupDto,
  GroupsService,
  InviteMemberDto,
  TransferLeaderDto,
} from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  listGroups() {
    return this.groupsService.listGroups();
  }

  @Post()
  async createGroup(@Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(dto);
  }

  @Get(':groupId/members')
  listMembers(@Param('groupId') groupId: string) {
    return this.groupsService.listMembers(groupId);
  }

  @Post(':groupId/invites')
  invite(@Param('groupId') groupId: string, @Body() dto: InviteMemberDto) {
    return this.groupsService.invite(groupId, dto);
  }

  @Post(':groupId/transfer-leader')
  transferLeader(
    @Param('groupId') groupId: string,
    @Body() dto: TransferLeaderDto,
  ) {
    return this.groupsService.transferLeader(groupId, dto);
  }

  @Delete(':groupId/members/:memberId')
  removeMember(@Param('groupId') groupId: string, @Param('memberId') memberId: string) {
    return this.groupsService.removeMember(groupId, memberId);
  }

  @Delete(':groupId')
  async deleteGroup(@Param('groupId') groupId: string) {
    return this.groupsService.deleteGroup(groupId);
  }
}
