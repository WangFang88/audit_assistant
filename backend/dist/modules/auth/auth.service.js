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
exports.UpdateProfileDto = exports.RegisterDto = exports.RefreshTokenDto = exports.LoginDto = exports.AuthService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const auth_user_repository_1 = require("../../database/repositories/auth-user.repository");
const user_entity_1 = require("../../database/entities/user.entity");
const local_state_service_1 = require("../subscriptions/local-state.service");
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], LoginDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[\d\s\-()]{11,20}$/),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "name", void 0);
let AuthService = class AuthService {
    constructor(localStateService, authUserRepository, userRepository) {
        this.localStateService = localStateService;
        this.authUserRepository = authUserRepository;
        this.userRepository = userRepository;
        this.demoUsers = [
            {
                id: 'user-1',
                name: '系统管理员',
                phone: '13800138000',
                role: 'admin',
                trialEndsAt: '2026-05-01',
                passwordHash: (0, crypto_1.createHash)('sha256').update('123456').digest('hex'),
                subscriptionType: 'admin-preview',
            },
            {
                id: 'user-2',
                name: '审计组长',
                phone: '13800138001',
                role: 'member',
                trialEndsAt: '2026-05-01',
                passwordHash: (0, crypto_1.createHash)('sha256').update('123456').digest('hex'),
                subscriptionType: 'free',
            },
            {
                id: 'user-3',
                name: '审计助理',
                phone: '13800138002',
                role: 'member',
                trialEndsAt: '2026-05-01',
                passwordHash: (0, crypto_1.createHash)('sha256').update('123456').digest('hex'),
                subscriptionType: 'free',
            },
            {
                id: 'user-4',
                name: '法规顾问',
                phone: '13800138003',
                role: 'member',
                trialEndsAt: '2026-05-01',
                passwordHash: (0, crypto_1.createHash)('sha256').update('123456').digest('hex'),
                subscriptionType: 'free',
            },
        ];
        this.registeredUsers = [];
        this.currentUser = this.toPublicUser(this.demoUsers[0]);
        const persistedUsers = this.localStateService.readState().users;
        if (persistedUsers && persistedUsers.length > 0) {
            this.registeredUsers = persistedUsers
                .filter((user) => !this.demoUsers.some((demoUser) => demoUser.id === user.id))
                .map((user) => ({
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                trialEndsAt: user.trialEndsAt,
                passwordHash: user.passwordHash ?? user.password ?? '',
                passwordIsLegacyPlaintext: user.passwordHash == null,
                subscriptionType: 'free',
            }));
        }
        setImmediate(() => this.syncUsersToDatabase());
    }
    get users() {
        return [...this.demoUsers, ...this.registeredUsers];
    }
    toSnapshot(user) {
        return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            trialEndsAt: user.trialEndsAt,
            passwordHash: user.passwordHash,
            subscriptionType: user.subscriptionType,
        };
    }
    fromSnapshot(snapshot) {
        return {
            id: snapshot.id,
            name: snapshot.name,
            phone: snapshot.phone,
            role: snapshot.role,
            trialEndsAt: snapshot.trialEndsAt,
            passwordHash: snapshot.passwordHash,
            subscriptionType: snapshot.subscriptionType,
        };
    }
    toPublicUser(user) {
        return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            trialEndsAt: user.trialEndsAt,
        };
    }
    persistUsers() {
        this.localStateService.saveUsers(this.registeredUsers.map((user) => {
            const entity = this.authUserRepository.createEntity(this.toSnapshot(user));
            return {
                id: entity.id,
                name: entity.nickname,
                phone: entity.phone,
                role: entity.role,
                trialEndsAt: (entity.subscriptionExpiredAt ?? new Date('2026-05-01T00:00:00.000Z')).toISOString().slice(0, 10),
                passwordHash: entity.passwordHash,
            };
        }));
    }
    hashPassword(password) {
        return (0, crypto_1.createHash)('sha256').update(password).digest('hex');
    }
    verifyPassword(user, password) {
        const normalizedPassword = password.trim();
        if (user.passwordIsLegacyPlaintext) {
            return user.passwordHash === normalizedPassword;
        }
        return user.passwordHash === this.hashPassword(normalizedPassword);
    }
    upgradeLegacyPassword(user) {
        if (!user.passwordIsLegacyPlaintext) {
            return;
        }
        user.passwordHash = this.hashPassword(user.passwordHash);
        user.passwordIsLegacyPlaintext = false;
        this.persistUsers();
    }
    buildAccessToken(userId) {
        return `demo-access-token-${userId}`;
    }
    buildRefreshToken(userId) {
        return `demo-refresh-token-${userId}`;
    }
    normalizePhone(phone) {
        return phone.trim().replace(/[-\s()]/g, '');
    }
    findUserByPhone(phone) {
        const normalizedPhone = this.normalizePhone(phone);
        return this.users.find((user) => user.phone === normalizedPhone || (normalizedPhone === 'admin' && user.role === 'admin')) ?? null;
    }
    findUserByToken(token, prefix) {
        if (!token.startsWith(prefix)) {
            return null;
        }
        const userId = token.slice(prefix.length);
        return this.users.find((user) => user.id === userId) ?? null;
    }
    setCurrentUser(user) {
        this.currentUser = user;
        return user;
    }
    buildAuthResponse(user) {
        const publicUser = this.toPublicUser(user);
        this.setCurrentUser(publicUser);
        return {
            accessToken: this.buildAccessToken(user.id),
            refreshToken: this.buildRefreshToken(user.id),
            user: publicUser,
        };
    }
    createUserName(phone) {
        return `新用户${phone.slice(-4)}`;
    }
    login(dto) {
        const user = this.findUserByPhone(dto.phone);
        if (!user) {
            throw new common_1.UnauthorizedException('账号不存在，请先注册后再登录');
        }
        if (!this.verifyPassword(user, dto.password)) {
            throw new common_1.UnauthorizedException('密码错误，请重新输入');
        }
        this.upgradeLegacyPassword(user);
        return this.buildAuthResponse(user);
    }
    register(dto) {
        const phone = this.normalizePhone(dto.phone);
        const passwordHash = this.hashPassword(dto.password.trim());
        if (phone === 'admin') {
            throw new common_1.BadRequestException('admin 为保留账号，不能用于注册');
        }
        if (this.findUserByPhone(phone)) {
            throw new common_1.BadRequestException('该手机号已注册，请直接登录');
        }
        const user = {
            id: `user-${Date.now()}`,
            name: this.createUserName(phone),
            phone,
            role: 'member',
            trialEndsAt: '2026-05-01',
            passwordHash,
            subscriptionType: 'free',
        };
        this.registeredUsers = [...this.registeredUsers, user];
        this.persistUsers();
        return this.buildAuthResponse(user);
    }
    refresh(dto) {
        const user = this.findUserByToken(dto.refreshToken, 'demo-refresh-token-');
        if (!user) {
            throw new common_1.UnauthorizedException('Refresh token 无效');
        }
        return this.buildAuthResponse(user);
    }
    validateAccessToken(token) {
        const user = this.findUserByToken(token, 'demo-access-token-');
        if (!user) {
            return null;
        }
        return this.setCurrentUser(this.toPublicUser(user));
    }
    me() {
        return this.currentUser;
    }
    getUserByPhone(phone) {
        return this.findUserByPhone(phone);
    }
    updateProfile(dto) {
        const user = this.users.find((u) => u.id === this.currentUser.id);
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        user.name = dto.name;
        this.currentUser = { ...this.currentUser, name: dto.name };
        return this.currentUser;
    }
    async syncUsersToDatabase() {
        for (const user of this.users) {
            await this.userRepository.upsert({ id: user.id, phone: user.phone, nickname: user.name, passwordHash: user.passwordHash ?? '', role: user.role }, ['id']).catch(() => { });
        }
    }
    isAdmin() {
        return this.currentUser.role === 'admin';
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService,
        auth_user_repository_1.AuthUserRepository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map