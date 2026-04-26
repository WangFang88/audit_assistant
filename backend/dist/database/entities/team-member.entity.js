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
exports.TeamMemberEntity = void 0;
const typeorm_1 = require("typeorm");
let TeamMemberEntity = class TeamMemberEntity {
};
exports.TeamMemberEntity = TeamMemberEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id', type: 'int' }),
    __metadata("design:type", Number)
], TeamMemberEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TeamMemberEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TeamMemberEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role', type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], TeamMemberEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'joined_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], TeamMemberEntity.prototype, "joinedAt", void 0);
exports.TeamMemberEntity = TeamMemberEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'team_members' })
], TeamMemberEntity);
//# sourceMappingURL=team-member.entity.js.map