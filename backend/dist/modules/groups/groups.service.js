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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferLeaderDto = exports.InviteMemberDto = exports.CreateGroupDto = exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
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
    constructor() {
        this.groups = [
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
        this.members = [
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
    }
    listGroups() {
        return this.groups;
    }
    getGroupById(groupId) {
        const group = this.groups.find((item) => item.id === groupId);
        if (!group) {
            throw new common_1.NotFoundException('项目组不存在');
        }
        return group;
    }
    createGroup(dto) {
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
    listMembers(groupId) {
        this.getGroupById(groupId);
        return this.members.filter((member) => member.groupId === groupId);
    }
    invite(groupId, dto) {
        this.getGroupById(groupId);
        return {
            groupId,
            inviteCode: 'INVITE-2026',
            phone: dto.phone,
            role: dto.role,
            expiresAt: '2026-04-30 23:59',
        };
    }
    transferLeader(groupId, dto) {
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
        return {
            groupId,
            groupName: group.name,
            previousLeaderId,
            newLeaderId: dto.targetUserId,
            transferredAt: '2026-04-25 18:00',
        };
    }
    removeMember(groupId, memberId) {
        const group = this.getGroupById(groupId);
        const memberIndex = this.members.findIndex((member) => member.groupId === groupId && member.id === memberId);
        if (memberIndex < 0) {
            throw new common_1.NotFoundException('成员不存在');
        }
        const member = this.members[memberIndex];
        if (member.role === 'leader') {
            throw new common_1.BadRequestException('请先移交组长后再清退当前组长');
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
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)()
], GroupsService);
//# sourceMappingURL=groups.service.js.map