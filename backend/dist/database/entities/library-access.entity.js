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
exports.LibraryAccessEntity = void 0;
const typeorm_1 = require("typeorm");
let LibraryAccessEntity = class LibraryAccessEntity {
};
exports.LibraryAccessEntity = LibraryAccessEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], LibraryAccessEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], LibraryAccessEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'library_type', type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], LibraryAccessEntity.prototype, "libraryType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'region', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], LibraryAccessEntity.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount', type: 'decimal', precision: 12, scale: 2 }),
    __metadata("design:type", String)
], LibraryAccessEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], LibraryAccessEntity.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expired_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], LibraryAccessEntity.prototype, "expiredAt", void 0);
exports.LibraryAccessEntity = LibraryAccessEntity = __decorate([
    (0, typeorm_1.Entity)('library_access')
], LibraryAccessEntity);
//# sourceMappingURL=library-access.entity.js.map