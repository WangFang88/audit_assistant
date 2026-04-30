import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: { id: string; name: string; phone: string; role: string; trialEndsAt: string } }>();
    const user = request.user;
    if (!user) {
      return next.handle();
    }
    return new Observable((observer) => {
      this.authService.runWithUser(user as Parameters<AuthService['runWithUser']>[0], () => {
        next.handle().subscribe({
          next: (val) => observer.next(val),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
