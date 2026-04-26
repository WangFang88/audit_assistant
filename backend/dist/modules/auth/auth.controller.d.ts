import { AuthService, LoginDto, RefreshTokenDto } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
            trialEndsAt: string;
        };
    };
    me(): {
        id: string;
        name: string;
        phone: string;
        role: string;
        trialEndsAt: string;
    };
}
