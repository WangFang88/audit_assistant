declare class LoginDto {
    phone: string;
    password: string;
}
export declare class AuthService {
    private readonly accessToken;
    private readonly currentUser;
    login(dto: LoginDto): {
        accessToken: string;
        refreshToken: string;
        user: {
            phone: string;
            id: string;
            name: string;
            role: string;
            trialEndsAt: string;
        };
    };
    validateAccessToken(token: string): {
        id: string;
        name: string;
        phone: string;
        role: string;
        trialEndsAt: string;
    } | null;
    me(): {
        id: string;
        name: string;
        phone: string;
        role: string;
        trialEndsAt: string;
    };
}
export { LoginDto };
