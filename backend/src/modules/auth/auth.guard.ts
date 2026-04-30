import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
      runWithUser?: <T>(fn: () => T) => T;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('缺少 Authorization 请求头');
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authorization 格式错误');
    }

    const user = this.authService.validateAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('登录状态已失效');
    }

    request.user = user;
    request.runWithUser = (fn) => this.authService.runWithUser(user, fn);
    return true;
  }
}
