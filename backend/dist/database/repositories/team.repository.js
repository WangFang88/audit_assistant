"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRepository = void 0;
const common_1 = require("@nestjs/common");
const team_entity_1 = require("../entities/team.entity");
const team_member_entity_1 = require("../entities/team-member.entity");
const date_1 = require("../../utils/date");
let TeamRepository = class TeamRepository {
    mapTeamEntity(entity, memberCount, privateDocumentCount) {
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
    createTeamEntity(snapshot) {
        const entity = new team_entity_1.TeamEntity();
        entity.id = snapshot.id;
        entity.name = snapshot.name;
        entity.organizationName = snapshot.organizationName;
        entity.ownerUserId = snapshot.ownerUserId;
        entity.lastQueryAt = snapshot.lastQueryAt ? new Date(snapshot.lastQueryAt.replace(' ', 'T')) : null;
        return entity;
    }
    createTeamMemberEntity(snapshot) {
        const entity = new team_member_entity_1.TeamMemberEntity();
        entity.teamId = snapshot.groupId;
        entity.userId = snapshot.userId;
        entity.role = snapshot.role;
        return entity;
    }
    formatDateTime(date) {
        return (0, date_1.formatCst)(date, false);
    }
};
exports.TeamRepository = TeamRepository;
exports.TeamRepository = TeamRepository = __decorate([
    (0, common_1.Injectable)()
], TeamRepository);
//# sourceMappingURL=team.repository.js.map