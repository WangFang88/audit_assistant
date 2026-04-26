"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUserRepository = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../entities/user.entity");
let AuthUserRepository = class AuthUserRepository {
    mapEntityToSnapshot(entity) {
        return {
            id: entity.id,
            name: entity.nickname,
            phone: entity.phone,
            role: entity.role,
            trialEndsAt: entity.subscriptionExpiredAt?.toISOString().slice(0, 10) ?? '2026-05-01',
            passwordHash: entity.passwordHash,
            subscriptionType: entity.subscriptionType,
        };
    }
    createEntity(snapshot) {
        const entity = new user_entity_1.UserEntity();
        entity.id = snapshot.id;
        entity.nickname = snapshot.name;
        entity.phone = snapshot.phone;
        entity.role = snapshot.role;
        entity.passwordHash = snapshot.passwordHash;
        entity.subscriptionType = snapshot.subscriptionType;
        entity.subscriptionExpiredAt = new Date(`${snapshot.trialEndsAt}T00:00:00.000Z`);
        return entity;
    }
};
exports.AuthUserRepository = AuthUserRepository;
exports.AuthUserRepository = AuthUserRepository = __decorate([
    (0, common_1.Injectable)()
], AuthUserRepository);
//# sourceMappingURL=auth-user.repository.js.map