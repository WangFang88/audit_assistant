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
exports.TeamEntity = void 0;
const typeorm_1 = require("typeorm");
let TeamEntity = class TeamEntity {
};
exports.TeamEntity = TeamEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'team_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TeamEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], TeamEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'owner_user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TeamEntity.prototype, "ownerUserId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], TeamEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_name', type: 'varchar', length: 160 }),
    __metadata("design:type", String)
], TeamEntity.prototype, "organizationName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_query_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], TeamEntity.prototype, "lastQueryAt", void 0);
exports.TeamEntity = TeamEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'teams' })
], TeamEntity);
//# sourceMappingURL=team.entity.js.map