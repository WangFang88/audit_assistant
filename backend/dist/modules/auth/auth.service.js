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
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const async_hooks_1 = require("async_hooks");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const auth_user_repository_1 = require("../../database/repositories/auth-user.repository");
const user_entity_1 = require("../../database/entities/user.entity");
const audit_service_1 = require("../audit/audit.service");
const local_state_service_1 = require("../subscriptions/local-state.service");
const redis_user_cache_service_1 = require("./redis-user-cache.service");
const BCRYPT_ROUNDS = 10;
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '账号不能为空' }),
    (0, class_validator_1.MinLength)(3, { message: '账号至少需要 3 位' }),
    __metadata("design:type", String)
], LoginDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '密码不能为空' }),
    (0, class_validator_1.MinLength)(6, { message: '密码至少需要 6 位' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'refreshToken 不能为空' }),
    (0, class_validator_1.MinLength)(6, { message: 'refreshToken 格式错误' }),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '手机号不能为空' }),
    (0, class_validator_1.Matches)(/^[\d\s\-()]{11,20}$/, { message: '请输入有效的手机号' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: '密码不能为空' }),
    (0, class_validator_1.MinLength)(6, { message: '密码至少需要 6 位' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsString)({ message: '姓名不能为空' }),
    (0, class_validator_1.MinLength)(2, { message: '姓名至少需要 2 个字符' }),
    (0, class_validator_1.MaxLength)(20, { message: '姓名最多 20 个字符' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "name", void 0);
let AuthService = class AuthService {
    constructor(localStateService, authUserRepository, userRepository, auditService, redisCache) {
        this.localStateService = localStateService;
        this.authUserRepository = authUserRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.redisCache = redisCache;
        this.registeredUsers = [];
        this.userStorage = new async_hooks_1.AsyncLocalStorage();
        this.jwtSecret = process.env.JWT_SECRET ?? this.generateFallbackSecret();
        const adminPassword = process.env.ADMIN_PASSWORD ?? 'XiaoJia@2024!Audit';
        this.demoUsers = [
            {
                id: 'user-1',
                name: '系统管理员',
                phone: '13800138000',
                role: 'admin',
                trialEndsAt: '2099-12-31',
                passwordHash: bcrypt.hashSync(adminPassword, BCRYPT_ROUNDS),
                subscriptionType: 'admin-preview',
            },
        ];
        setImmediate(() => this.loadUsersFromDatabase());
    }
    generateFallbackSecret() {
        return require('crypto').randomBytes(32).toString('hex');
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
    }
    async hashPassword(password) {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    async verifyPassword(user, password) {
        return bcrypt.compare(password.trim(), user.passwordHash);
    }
    buildAccessToken(userId) {
        return jwt.sign({ sub: userId }, this.jwtSecret, { expiresIn: '24h' });
    }
    buildRefreshToken(userId) {
        return jwt.sign({ sub: userId, type: 'refresh' }, this.jwtSecret, { expiresIn: '7d' });
    }
    normalizePhone(phone) {
        return phone.trim().replace(/[-\s()]/g, '');
    }
    findUserByPhone(phone) {
        const normalizedPhone = this.normalizePhone(phone);
        return this.users.find((user) => user.phone === normalizedPhone || (normalizedPhone === 'admin' && user.role === 'admin')) ?? null;
    }
    verifyToken(token, expectRefresh) {
        try {
            const payload = jwt.verify(token, this.jwtSecret);
            if (expectRefresh) {
                if (payload.type !== 'refresh')
                    return null;
            }
            else {
                if (payload.type === 'refresh')
                    return null;
            }
            return { sub: payload.sub };
        }
        catch {
            return null;
        }
    }
    setCurrentUser(user) {
        return user;
    }
    buildAuthResponse(user) {
        const publicUser = this.toPublicUser(user);
        return {
            accessToken: this.buildAccessToken(user.id),
            refreshToken: this.buildRefreshToken(user.id),
            user: publicUser,
        };
    }
    createUserName(phone) {
        return `新用户${phone.slice(-4)}`;
    }
    getDefaultTrialEndsAt(baseDate = new Date()) {
        const nextDate = new Date(baseDate.getTime());
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        return nextDate.toISOString().slice(0, 10);
    }
    async login(dto) {
        const user = this.findUserByPhone(dto.phone);
        if (!user) {
            throw new common_1.UnauthorizedException('账号不存在，请先注册后再登录');
        }
        if (!(await this.verifyPassword(user, dto.password))) {
            throw new common_1.UnauthorizedException('密码错误，请重新输入');
        }
        const response = this.buildAuthResponse(user);
        await this.auditService.recordEvent({
            eventType: 'auth.login',
            actorUserId: user.id,
            actorName: user.name,
            targetType: 'user',
            targetId: user.id,
            summary: '登录了系统',
            detail: { role: user.role },
        });
        return response;
    }
    async register(dto) {
        const phone = this.normalizePhone(dto.phone);
        const passwordHash = await this.hashPassword(dto.password.trim());
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
            trialEndsAt: this.getDefaultTrialEndsAt(),
            passwordHash,
            subscriptionType: 'free',
        };
        this.registeredUsers = [...this.registeredUsers, user];
        this.persistUsers();
        await this.userRepository.upsert({ id: user.id, phone: user.phone, nickname: user.name, passwordHash: user.passwordHash ?? '', role: 'member' }, ['id']).catch(() => { });
        await this.redisCache.setUser(user).catch(() => { });
        const response = this.buildAuthResponse(user);
        await this.auditService.recordEvent({
            eventType: 'auth.register',
            actorUserId: user.id,
            actorName: user.name,
            targetType: 'user',
            targetId: user.id,
            summary: '注册并开通了试用账号',
            detail: { phone: user.phone, trialEndsAt: user.trialEndsAt },
        });
        return response;
    }
    refresh(dto) {
        const payload = this.verifyToken(dto.refreshToken, true);
        if (!payload) {
            throw new common_1.UnauthorizedException('Refresh token 无效或已过期');
        }
        const user = this.users.find((u) => u.id === payload.sub);
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        return this.buildAuthResponse(user);
    }
    validateAccessToken(token) {
        const payload = this.verifyToken(token, false);
        if (!payload) {
            return null;
        }
        const user = this.users.find((u) => u.id === payload.sub);
        if (!user) {
            return null;
        }
        return this.toPublicUser(user);
    }
    me() {
        const user = this.userStorage.getStore();
        if (!user) {
            throw new common_1.UnauthorizedException('未登录');
        }
        return user;
    }
    runWithUser(user, fn) {
        return this.userStorage.run(user, fn);
    }
    getUserByPhone(phone) {
        return this.findUserByPhone(phone);
    }
    getUserById(id) {
        return this.users.find((u) => u.id === id) ?? null;
    }
    async updateProfile(dto) {
        const currentUser = this.me();
        const user = this.users.find((u) => u.id === currentUser.id);
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        user.name = dto.name;
        this.persistUsers();
        await this.userRepository.update({ id: currentUser.id }, { nickname: dto.name }).catch(() => { });
        await this.redisCache.updateUser(currentUser.id, { name: dto.name }).catch(() => { });
        return { ...currentUser, name: dto.name };
    }
    async loadUsersFromDatabase() {
        await this.redisCache.connect();
        const dbUsers = await this.userRepository.find({ where: { role: 'member' } });
        this.registeredUsers = dbUsers
            .filter((u) => !this.demoUsers.some((d) => d.id === u.id))
            .map((u) => ({
            id: u.id,
            name: u.nickname,
            phone: u.phone,
            role: u.role,
            trialEndsAt: '2099-12-31',
            passwordHash: u.passwordHash,
            subscriptionType: 'free',
        }));
        for (const user of [...this.demoUsers, ...this.registeredUsers]) {
            await this.redisCache.setUser(user).catch(() => { });
        }
        for (const user of this.demoUsers) {
            await this.userRepository.upsert({ id: user.id, phone: user.phone, nickname: user.name, passwordHash: user.passwordHash ?? '', role: user.role }, ['id']).catch(() => { });
        }
    }
    isAdmin() {
        return this.me().role === 'admin';
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [local_state_service_1.LocalStateService,
        auth_user_repository_1.AuthUserRepository,
        typeorm_2.Repository,
        audit_service_1.AuditService,
        redis_user_cache_service_1.RedisUserCacheService])
], AuthService);
//# sourceMappingURL=auth.service.js.map