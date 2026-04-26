declare class LoginDto {
    phone: string;
    password: string;
}
declare class RefreshTokenDto {
    refreshToken: string;
}
type DemoUser = {
    id: string;
    name: string;
    phone: string;
    role: 'admin' | 'member';
    trialEndsAt: string;
};
export declare class AuthService {
    private readonly users;
    private currentUser;
    private buildAccessToken;
    private buildRefreshToken;
    private findUserByPhone;
    private findUserByToken;
    private setCurrentUser;
    login(dto: LoginDto): {
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
export { LoginDto, RefreshTokenDto };
