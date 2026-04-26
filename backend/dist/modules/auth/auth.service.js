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
exports.RegisterDto = exports.RefreshTokenDto = exports.LoginDto = exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
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
    (0, class_validator_1.Matches)(/^\d{11}$/),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
let AuthService = class AuthService {
    constructor(localStateService) {
        this.localStateService = localStateService;
        this.demoUsers = [
            {
                id: 'user-1',
                name: '系统管理员',
                phone: '13800138000',
                role: 'admin',
                trialEndsAt: '2026-05-01',
                password: '123456',
            },
            {
                id: 'user-2',
                name: '审计组长',
                phone: '13800138001',
                role: 'member',
                trialEndsAt: '2026-05-01',
                password: '123456',
            },
            {
                id: 'user-3',
                name: '审计助理',
                phone: '13800138002',
                role: 'member',
                trialEndsAt: '2026-05-01',
                password: '123456',
            },
            {
                id: 'user-4',
                name: '法规顾问',
                phone: '13800138003',
                role: 'member',
                trialEndsAt: '2026-05-01',
                password: '123456',
            },
        ];
        this.registeredUsers = [];
        this.currentUser = this.toPublicUser(this.demoUsers[0]);
        const persistedUsers = this.localStateService.readState().users;
        if (persistedUsers && persistedUsers.length > 0) {
            this.registeredUsers = persistedUsers.filter((user) => !this.demoUsers.some((demoUser) => demoUser.id === user.id));
        }
    }
    get users() {
        return [...this.demoUsers, ...this.registeredUsers];
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
        this.localStateService.saveUsers(this.registeredUsers);
    }
    buildAccessToken(userId) {
        return `demo-access-token-${userId}`;
    }
    buildRefreshToken(userId) {
        return `demo-refresh-token-${userId}`;
    }
    normalizePhone(phone) {
        return phone.trim();
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
        if (user.password !== dto.password.trim()) {
            throw new common_1.UnauthorizedException('密码错误，请重新输入');
        }
        return this.buildAuthResponse(user);
    }
    register(dto) {
        const phone = this.normalizePhone(dto.phone);
        const password = dto.password.trim();
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
            password,
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
    isAdmin() {
        return this.currentUser.role === 'admin';
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService])
], AuthService);
//# sourceMappingURL=auth.service.js.map