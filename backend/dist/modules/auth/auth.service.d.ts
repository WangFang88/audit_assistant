import { AuthUserRepository } from '../../database/repositories/auth-user.repository';
import { LocalStateService } from '../subscriptions/local-state.service';
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
type DemoUser = {
    id: string;
    name: string;
    phone: string;
    role: 'admin' | 'member';
    trialEndsAt: string;
};
export declare class AuthService {
    private readonly localStateService;
    private readonly authUserRepository;
    constructor(localStateService: LocalStateService, authUserRepository: AuthUserRepository);
    private readonly demoUsers;
    private registeredUsers;
    private currentUser;
    private get users();
    private toSnapshot;
    private fromSnapshot;
    private toPublicUser;
    private persistUsers;
    private buildAccessToken;
    private buildRefreshToken;
    private normalizePhone;
    private findUserByPhone;
    private findUserByToken;
    private setCurrentUser;
    private buildAuthResponse;
    private createUserName;
    login(dto: LoginDto): {
        accessToken: string;
        refreshToken: string;
        user: DemoUser;
    };
    register(dto: RegisterDto): {
        accessToken: string;
        refreshToken: string;
        user: DemoUser;
    };
    refresh(dto: RefreshTokenDto): {
        accessToken: string;
        refreshToken: string;
        user: DemoUser;
    };
    validateAccessToken(token: string): DemoUser | null;
    me(): DemoUser;
    isAdmin(): boolean;
}
export { LoginDto, RefreshTokenDto, RegisterDto };
