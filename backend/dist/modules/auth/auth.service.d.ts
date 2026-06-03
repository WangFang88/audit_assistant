import { Repository } from 'typeorm';
import { AuthUserRepository } from '../../database/repositories/auth-user.repository';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { LocalStateService } from '../subscriptions/local-state.service';
import { RedisUserCacheService } from './redis-user-cache.service';
declare class LoginDto {
    phone: string;
    password: string;
}
declare class RefreshTokenDto {
    refreshToken: string;
}
declare class RegisterDto {
    phone: string;
    password: string;
}
declare class UpdateProfileDto {
    name: string;
}
type DemoUser = {
    id: string;
    name: string;
    phone: string;
    role: 'admin' | 'member';
    trialEndsAt: string;
};
type AuthUserRecord = DemoUser & {
    passwordHash: string;
    subscriptionType: string;
};
export declare class AuthService {
    private readonly localStateService;
    private readonly authUserRepository;
    private readonly userRepository;
    private readonly auditService;
    private readonly redisCache;
    private readonly jwtSecret;
    private readonly demoUsers;
    constructor(localStateService: LocalStateService, authUserRepository: AuthUserRepository, userRepository: Repository<UserEntity>, auditService: AuditService, redisCache: RedisUserCacheService);
    private generateFallbackSecret;
    private registeredUsers;
    private readonly userStorage;
    private get users();
    private toSnapshot;
    private fromSnapshot;
    private toPublicUser;
    private persistUsers;
    private hashPassword;
    private verifyPassword;
    private buildAccessToken;
    private buildRefreshToken;
    private normalizePhone;
    private findUserByPhone;
    private verifyToken;
    private setCurrentUser;
    private buildAuthResponse;
    private createUserName;
    private getDefaultTrialEndsAt;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: DemoUser;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: DemoUser;
    }>;
    refresh(dto: RefreshTokenDto): {
        accessToken: string;
        refreshToken: string;
        user: DemoUser;
    };
    validateAccessToken(token: string): DemoUser | null;
    me(): DemoUser;
    runWithUser<T>(user: DemoUser, fn: () => T): T;
    getUserByPhone(phone: string): AuthUserRecord | null;
    getUserById(id: string): AuthUserRecord | null;
    updateProfile(dto: UpdateProfileDto): Promise<{
        name: string;
        id: string;
        phone: string;
        role: "admin" | "member";
        trialEndsAt: string;
    }>;
    private loadUsersFromDatabase;
    isAdmin(): boolean;
}
export { LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto };
