"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMemberRoleDto = exports.TransferLeaderDto = exports.InviteMemberDto = exports.CreateGroupDto = exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const class_validator_1 = require("class-validator");
const typeorm_2 = require("typeorm");
const team_member_entity_1 = require("../../database/entities/team-member.entity");
const team_entity_1 = require("../../database/entities/team.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const auth_service_1 = require("../auth/auth.service");
const chat_service_1 = require("../chat/chat.service");
const documents_service_1 = require("../documents/documents.service");
const team_agents_service_1 = require("../team-agents/team-agents.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
class CreateGroupDto {
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "organizationName", void 0);
class InviteMemberDto {
}
exports.InviteMemberDto = InviteMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['member', 'leader']),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "role", void 0);
class TransferLeaderDto {
}
exports.TransferLeaderDto = TransferLeaderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransferLeaderDto.prototype, "targetUserId", void 0);
class UpdateMemberRoleDto {
}
exports.UpdateMemberRoleDto = UpdateMemberRoleDto;
__decorate([
    (0, class_validator_1.IsIn)(['member', 'leader']),
    __metadata("design:type", String)
], UpdateMemberRoleDto.prototype, "role", void 0);
let GroupsService = class GroupsService {
    constructor(authService, subscriptionsService, teamRepository, teamMemberRepository, userRepository, documentsService, chatService, teamAgentsService) {
        this.authService = authService;
        this.subscriptionsService = subscriptionsService;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.documentsService = documentsService;
        this.chatService = chatService;
        this.teamAgentsService = teamAgentsService;
    }
    toGroupRecord(entity, memberCount, privateDocumentCount) {
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
    toMemberRecord(entity) {
        return {
            id: String(entity.id),
            groupId: entity.teamId,
            userId: entity.userId,
            name: entity.userId,
            phone: '',
            role: entity.role,
        };
    }
    async ensureSeedData() {
        const count = await this.teamRepository.count();
        if (count > 0) {
            return;
        }
        await this.teamRepository.save(this.teamRepository.create({
            id: 'group-1',
            name: '某区财政局审计组',
            organizationName: '某区财政局',
            ownerUserId: 'user-2',
            lastQueryAt: new Date('2026-04-25T16:20:00'),
        }));
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
    }
    assertAdminCannotManageGroups() {
        if (!this.authService.isAdmin()) {
            return;
        }
        throw new common_1.ForbiddenException('管理员不参与项目组，无法执行项目组相关操作');
    }
    getCurrentUser() {
        return this.authService.me();
    }
    async isCurrentUserMemberOfGroup(groupId) {
        const user = this.getCurrentUser();
        const member = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: user.id });
        return member != null;
    }
    async assertCanAccessGroup(groupId) {
        if (this.authService.isAdmin()) {
            throw new common_1.ForbiddenException('管理员不参与项目组，无法访问项目组相关数据');
        }
        await this.getGroupById(groupId);
        if (await this.isCurrentUserMemberOfGroup(groupId)) {
            return;
        }
        throw new common_1.ForbiddenException('当前账号不属于该项目组，无法访问相关数据');
    }
    async assertIsLeader(groupId) {
        await this.assertCanAccessGroup(groupId);
        const currentUser = this.getCurrentUser();
        const member = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
        if (member?.role !== 'leader') {
            throw new common_1.ForbiddenException('只有组长才能执行此操作');
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
        return Promise.all(teams.map(async (team) => {
            const memberCount = await this.teamMemberRepository.countBy({ teamId: team.id });
            return this.toGroupRecord(team, memberCount, 0);
        }));
    }
    async getGroupById(groupId) {
        await this.ensureSeedData();
        const team = await this.teamRepository.findOneBy({ id: groupId });
        if (!team) {
            throw new common_1.NotFoundException('项目组不存在');
        }
        const memberCount = await this.teamMemberRepository.countBy({ teamId: groupId });
        return this.toGroupRecord(team, memberCount, 0);
    }
    async createGroup(dto) {
        this.assertAdminCannotManageGroups();
        const currentUser = this.getCurrentUser();
        const existingGroups = await this.listGroups();
        this.subscriptionsService.assertCanCreateGroup(existingGroups.length);
        const groupId = `group-${Date.now()}`;
        await this.teamRepository.save(this.teamRepository.create({
            id: groupId,
            name: dto.name,
            organizationName: dto.organizationName,
            ownerUserId: currentUser.id,
            lastQueryAt: null,
        }));
        await this.teamMemberRepository.save(this.teamMemberRepository.create({ teamId: groupId, userId: currentUser.id, role: 'leader' }));
        const group = await this.getGroupById(groupId);
        const conversation = await this.chatService.createAgentConversation(group);
        await this.chatService.syncGroupConversationParticipants(groupId, [currentUser.id]);
        await this.teamAgentsService.createForGroup(group, conversation.id);
        this.subscriptionsService.syncUsage({ groups: existingGroups.length + 1 });
        return group;
    }
    async listMembers(groupId) {
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
    async updateMemberRole(groupId, memberId, dto) {
        this.assertAdminCannotManageGroups();
        await this.assertCanAccessGroup(groupId);
        const currentUser = this.getCurrentUser();
        const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
        if (currentMember?.role !== 'leader') {
            throw new common_1.ForbiddenException('只有组长才能修改成员角色');
        }
        const target = await this.teamMemberRepository.findOneBy({ teamId: groupId, id: Number(memberId) });
        if (!target) {
            throw new common_1.NotFoundException('成员不存在');
        }
        await this.teamMemberRepository.update({ id: Number(memberId) }, { role: dto.role });
        return { groupId, memberId, role: dto.role };
    }
    async invite(groupId, dto) {
        this.assertAdminCannotManageGroups();
        await this.assertCanAccessGroup(groupId);
        const targetUser = this.authService.getUserByPhone(dto.phone);
        if (!targetUser) {
            throw new common_1.NotFoundException('该手机号未注册');
        }
        const existing = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: targetUser.id });
        if (existing) {
            throw new common_1.BadRequestException('该用户已是项目组成员');
        }
        await this.teamMemberRepository.save(this.teamMemberRepository.create({ teamId: groupId, userId: targetUser.id, role: dto.role }));
        await this.chatService.syncGroupConversationParticipants(groupId, [targetUser.id]);
        const members = await this.teamMemberRepository.findBy({ teamId: groupId });
        return {
            groupId,
            phone: dto.phone,
            role: dto.role,
            memberCount: members.length,
        };
    }
    async transferLeader(groupId, dto) {
        this.assertAdminCannotManageGroups();
        await this.assertCanAccessGroup(groupId);
        const currentUser = this.getCurrentUser();
        const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
        if (currentMember?.role !== 'leader') {
            throw new common_1.ForbiddenException('只有组长才能移交组长权限');
        }
        const group = await this.getGroupById(groupId);
        const newLeader = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: dto.targetUserId });
        if (!newLeader) {
            throw new common_1.NotFoundException('目标成员不存在');
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
    async removeMember(groupId, memberId) {
        this.assertAdminCannotManageGroups();
        const group = await this.getGroupById(groupId);
        await this.assertCanAccessGroup(groupId);
        const currentUser = this.getCurrentUser();
        const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
        const member = await this.teamMemberRepository.findOneBy({ id: Number(memberId), teamId: groupId });
        if (!member) {
            throw new common_1.NotFoundException('成员不存在');
        }
        const isSelfExit = member.userId === currentUser.id;
        if (isSelfExit) {
            if (member.role === 'leader') {
                throw new common_1.BadRequestException('组长请先移交组长身份后再退出项目组');
            }
        }
        else {
            if (currentMember?.role !== 'leader') {
                throw new common_1.ForbiddenException('只有组长才能清退组员');
            }
            if (member.role === 'leader') {
                throw new common_1.BadRequestException('请先移交组长后再清退当前组长');
            }
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
            action: isSelfExit ? 'quit' : 'remove',
        };
    }
    async deleteGroup(groupId) {
        this.assertAdminCannotManageGroups();
        await this.assertCanAccessGroup(groupId);
        const currentUser = this.getCurrentUser();
        const currentMember = await this.teamMemberRepository.findOneBy({ teamId: groupId, userId: currentUser.id });
        if (currentMember?.role !== 'leader') {
            throw new common_1.ForbiddenException('只有组长才能删除项目组');
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
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(team_entity_1.TeamEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(team_member_entity_1.TeamMemberEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => documents_service_1.DocumentsService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => team_agents_service_1.TeamAgentsService))),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        subscriptions_service_1.SubscriptionsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        documents_service_1.DocumentsService,
        chat_service_1.ChatService,
        team_agents_service_1.TeamAgentsService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map