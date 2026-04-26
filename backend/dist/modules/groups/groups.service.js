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
exports.TransferLeaderDto = exports.InviteMemberDto = exports.CreateGroupDto = exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const team_repository_1 = require("../../database/repositories/team.repository");
const auth_service_1 = require("../auth/auth.service");
const documents_service_1 = require("../documents/documents.service");
const local_state_service_1 = require("../subscriptions/local-state.service");
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
let GroupsService = class GroupsService {
    constructor(authService, subscriptionsService, localStateService, teamRepository, documentsService) {
        this.authService = authService;
        this.subscriptionsService = subscriptionsService;
        this.localStateService = localStateService;
        this.teamRepository = teamRepository;
        this.documentsService = documentsService;
        this.groups = [
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
        this.members = [
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
        const persistedState = this.localStateService.readState();
        if (persistedState.groups) {
            this.groups.splice(0, this.groups.length, ...persistedState.groups);
        }
        if (persistedState.members) {
            this.members.splice(0, this.members.length, ...persistedState.members);
        }
    }
    toTeamSnapshot(group) {
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
    toMemberSnapshot(member) {
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
        this.localStateService.saveGroups(this.groups.map((group) => {
            const teamEntity = this.teamRepository.createTeamEntity(this.toTeamSnapshot(group));
            return this.teamRepository.mapTeamEntity(teamEntity, group.memberCount, group.privateDocumentCount);
        }), this.members.map((member) => {
            this.teamRepository.createTeamMemberEntity(this.toMemberSnapshot(member));
            return member;
        }));
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
    isCurrentUserMemberOfGroup(groupId) {
        const user = this.getCurrentUser();
        return this.members.some((member) => member.groupId === groupId && member.userId === user.id);
    }
    assertCanAccessGroup(groupId) {
        if (this.authService.isAdmin()) {
            throw new common_1.ForbiddenException('管理员不参与项目组，无法访问项目组相关数据');
        }
        this.getGroupById(groupId);
        if (this.isCurrentUserMemberOfGroup(groupId)) {
            return;
        }
        throw new common_1.ForbiddenException('当前账号不属于该项目组，无法访问相关数据');
    }
    listGroups() {
        if (this.authService.isAdmin()) {
            return [];
        }
        const currentUserId = this.getCurrentUser().id;
        const memberGroupIds = new Set(this.members.filter((member) => member.userId === currentUserId).map((member) => member.groupId));
        return this.groups.filter((group) => memberGroupIds.has(group.id));
    }
    getGroupById(groupId) {
        const group = this.groups.find((item) => item.id === groupId);
        if (!group) {
            throw new common_1.NotFoundException('项目组不存在');
        }
        return group;
    }
    createGroup(dto) {
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
        this.persistState();
        this.subscriptionsService.syncUsage({ groups: this.groups.length });
        return group;
    }
    listMembers(groupId) {
        this.assertAdminCannotManageGroups();
        this.assertCanAccessGroup(groupId);
        return this.members.filter((member) => member.groupId === groupId);
    }
    invite(groupId, dto) {
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
    transferLeader(groupId, dto) {
        this.assertAdminCannotManageGroups();
        this.assertCanAccessGroup(groupId);
        const group = this.getGroupById(groupId);
        const currentLeader = this.members.find((member) => member.groupId === groupId && member.userId === group.ownerUserId);
        const newLeader = this.members.find((member) => member.groupId === groupId && member.userId === dto.targetUserId);
        if (!newLeader) {
            throw new common_1.NotFoundException('目标成员不存在');
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
    removeMember(groupId, memberId) {
        this.assertAdminCannotManageGroups();
        const group = this.getGroupById(groupId);
        this.assertCanAccessGroup(groupId);
        const memberIndex = this.members.findIndex((member) => member.groupId === groupId && member.id === memberId);
        if (memberIndex < 0) {
            throw new common_1.NotFoundException('成员不存在');
        }
        const member = this.members[memberIndex];
        if (member.role === 'leader') {
            throw new common_1.BadRequestException('请先移交组长后再清退当前组长');
        }
        this.members.splice(memberIndex, 1);
        group.memberCount = this.members.filter((item) => item.groupId === groupId).length;
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
    deleteGroup(groupId) {
        this.assertAdminCannotManageGroups();
        this.assertCanAccessGroup(groupId);
        const groupIndex = this.groups.findIndex((group) => group.id === groupId);
        if (groupIndex < 0) {
            throw new common_1.NotFoundException('项目组不存在');
        }
        const group = this.groups[groupIndex];
        this.groups.splice(groupIndex, 1);
        this.members.splice(0, this.members.length, ...this.members.filter((member) => member.groupId !== groupId));
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
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => documents_service_1.DocumentsService))),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        subscriptions_service_1.SubscriptionsService,
        local_state_service_1.LocalStateService,
        team_repository_1.TeamRepository,
        documents_service_1.DocumentsService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map