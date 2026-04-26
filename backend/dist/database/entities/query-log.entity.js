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
exports.QueryLogEntity = void 0;
const typeorm_1 = require("typeorm");
let QueryLogEntity = class QueryLogEntity {
};
exports.QueryLogEntity = QueryLogEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'log_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], QueryLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], QueryLogEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'team_id', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], QueryLogEntity.prototype, "teamId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'query_text', type: 'text' }),
    __metadata("design:type", String)
], QueryLogEntity.prototype, "queryText", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'queried_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], QueryLogEntity.prototype, "queriedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consumed_quota', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], QueryLogEntity.prototype, "consumedQuota", void 0);
exports.QueryLogEntity = QueryLogEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'query_logs' })
], QueryLogEntity);
//# sourceMappingURL=query-log.entity.js.map