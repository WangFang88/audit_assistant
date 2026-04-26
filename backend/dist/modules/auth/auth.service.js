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
        this.accessToken = 'demo-access-token';
        this.refreshToken = 'demo-refresh-token';
        this.currentUser = {
            id: 'user-1',
            name: '系统管理员',
            phone: '13800138000',
            role: 'admin',
            trialEndsAt: '2026-05-01',
        };
    }
    login(dto) {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            user: {
                ...this.currentUser,
                phone: dto.phone,
            },
        };
    }
    refresh(dto) {
        if (dto.refreshToken != this.refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token 无效');
        }
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            user: this.currentUser,
        };
    }
    validateAccessToken(token) {
        if (token !== this.accessToken) {
            return null;
        }
        return this.currentUser;
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