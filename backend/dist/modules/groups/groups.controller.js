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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const groups_service_1 = require("./groups.service");
let GroupsController = class GroupsController {
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    listGroups() {
        return this.groupsService.listGroups();
    }
    async createGroup(dto) {
        return this.groupsService.createGroup(dto);
    }
    listMembers(groupId) {
        return this.groupsService.listMembers(groupId);
    }
    invite(groupId, dto) {
        return this.groupsService.invite(groupId, dto);
    }
    transferLeader(groupId, dto) {
        return this.groupsService.transferLeader(groupId, dto);
    }
    async removeMember(groupId, memberId) {
        return this.groupsService.removeMember(groupId, memberId);
    }
    async deleteGroup(groupId) {
        return this.groupsService.deleteGroup(groupId);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "listGroups", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [groups_service_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)(':groupId/members'),
    __param(0, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "listMembers", null);
__decorate([
    (0, common_1.Post)(':groupId/invites'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, groups_service_1.InviteMemberDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)(':groupId/transfer-leader'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, groups_service_1.TransferLeaderDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "transferLeader", null);
__decorate([
    (0, common_1.Delete)(':groupId/members/:memberId'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Delete)(':groupId'),
    __param(0, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteGroup", null);
exports.GroupsController = GroupsController = __decorate([
    (0, common_1.Controller)('groups'),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map