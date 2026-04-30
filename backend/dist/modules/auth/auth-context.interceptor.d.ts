import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
export declare class AuthContextInterceptor implements NestInterceptor {
    private readonly authService;
    constructor(authService: AuthService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
