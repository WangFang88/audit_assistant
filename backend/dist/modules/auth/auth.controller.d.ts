import { AuthService, LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: "admin" | "member";
            trialEndsAt: string;
        };
    }>;
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
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: "admin" | "member";
            trialEndsAt: string;
        };
    }>;
    me(): {
        id: string;
        name: string;
        phone: string;
        role: "admin" | "member";
        trialEndsAt: string;
    };
    updateProfile(dto: UpdateProfileDto): Promise<{
        id: string;
        name: string;
        phone: string;
        role: "admin" | "member";
        trialEndsAt: string;
    }>;
}
