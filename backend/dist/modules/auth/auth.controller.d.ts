import { AuthService, LoginDto, RefreshTokenDto, RegisterDto } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: "admin" | "member";
            trialEndsAt: string;
        };
    };
    refresh(dto: RefreshTokenDto): {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: "admin" | "member";
            trialEndsAt: string;
        };
    };
    register(dto: RegisterDto): {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: "admin" | "member";
            trialEndsAt: string;
        };
    };
    me(): {
        id: string;
        name: string;
        phone: string;
        role: "admin" | "member";
        trialEndsAt: string;
    };
}
