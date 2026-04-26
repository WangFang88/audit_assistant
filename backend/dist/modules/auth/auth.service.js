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
exports.RefreshTokenDto = exports.LoginDto = exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
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
let AuthService = class AuthService {
    constructor() {
        this.users = [
            {
                id: 'user-1',
                name: '系统管理员',
                phone: '13800138000',
                role: 'admin',
                trialEndsAt: '2026-05-01',
            },
            {
                id: 'user-2',
                name: '审计组长',
                phone: '13800138001',
                role: 'member',
                trialEndsAt: '2026-05-01',
            },
            {
                id: 'user-3',
                name: '审计助理',
                phone: '13800138002',
                role: 'member',
                trialEndsAt: '2026-05-01',
            },
            {
                id: 'user-4',
                name: '法规顾问',
                phone: '13800138003',
                role: 'member',
                trialEndsAt: '2026-05-01',
            },
        ];
        this.currentUser = this.users[0];
    }
    buildAccessToken(userId) {
        return `demo-access-token-${userId}`;
    }
    buildRefreshToken(userId) {
        return `demo-refresh-token-${userId}`;
    }
    findUserByPhone(phone) {
        const normalizedPhone = phone.trim();
        return this.users.find((user) => user.phone === normalizedPhone || (normalizedPhone == 'admin' && user.role === 'admin'));
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
    login(dto) {
        const user = this.findUserByPhone(dto.phone);
        if (!user) {
            throw new common_1.UnauthorizedException('账号不存在，请使用演示账号登录');
        }
        this.setCurrentUser(user);
        return {
            accessToken: this.buildAccessToken(user.id),
            refreshToken: this.buildRefreshToken(user.id),
            user,
        };
    }
    refresh(dto) {
        const user = this.findUserByToken(dto.refreshToken, 'demo-refresh-token-');
        if (!user) {
            throw new common_1.UnauthorizedException('Refresh token 无效');
        }
        this.setCurrentUser(user);
        return {
            accessToken: this.buildAccessToken(user.id),
            refreshToken: this.buildRefreshToken(user.id),
            user,
        };
    }
    validateAccessToken(token) {
        const user = this.findUserByToken(token, 'demo-access-token-');
        if (!user) {
            return null;
        }
        return this.setCurrentUser(user);
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
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map