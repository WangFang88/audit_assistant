import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsString()
  @MinLength(3)
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class RefreshTokenDto {
  @IsString()
  @MinLength(6)
  refreshToken!: string;
}

type DemoUser = {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  trialEndsAt: string;
};

@Injectable()
export class AuthService {
  private readonly users: DemoUser[] = [
    {
      id: 'user-1',
      name: '系统管理员',
      phone: '13800138000',
      role: 'admin',
      trialEndsAt: '2026-05-01',
    },
    {
      id: 'user-2',
      name: '审计组长',
      phone: '13800138001',
      role: 'member',
      trialEndsAt: '2026-05-01',
    },
    {
      id: 'user-3',
      name: '审计助理',
      phone: '13800138002',
      role: 'member',
      trialEndsAt: '2026-05-01',
    },
    {
      id: 'user-4',
      name: '法规顾问',
      phone: '13800138003',
      role: 'member',
      trialEndsAt: '2026-05-01',
    },
  ] as const;

  private currentUser = this.users[0];

  private buildAccessToken(userId: string) {
    return `demo-access-token-${userId}`;
  }

  private buildRefreshToken(userId: string) {
    return `demo-refresh-token-${userId}`;
  }

  private findUserByPhone(phone: string) {
    const normalizedPhone = phone.trim();
    return this.users.find((user) => user.phone === normalizedPhone || (normalizedPhone == 'admin' && user.role === 'admin'));
  }

  private findUserByToken(token: string, prefix: 'demo-access-token-' | 'demo-refresh-token-') {
    if (!token.startsWith(prefix)) {
      return null;
    }

    const userId = token.slice(prefix.length);
    return this.users.find((user) => user.id === userId) ?? null;
  }

  private setCurrentUser(user: DemoUser) {
    this.currentUser = user;
    return user;
  }

  login(dto: LoginDto) {
    const user = this.findUserByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('账号不存在，请使用演示账号登录');
    }

    this.setCurrentUser(user);

    return {
      accessToken: this.buildAccessToken(user.id),
      refreshToken: this.buildRefreshToken(user.id),
      user,
    };
  }

  refresh(dto: RefreshTokenDto) {
    const user = this.findUserByToken(dto.refreshToken, 'demo-refresh-token-');
    if (!user) {
      throw new UnauthorizedException('Refresh token 无效');
    }

    this.setCurrentUser(user);

    return {
      accessToken: this.buildAccessToken(user.id),
      refreshToken: this.buildRefreshToken(user.id),
      user,
    };
  }

  validateAccessToken(token: string) {
    const user = this.findUserByToken(token, 'demo-access-token-');
    if (!user) {
      return null;
    }

    return this.setCurrentUser(user);
  }

  me() {
    return this.currentUser;
  }

  isAdmin() {
    return this.currentUser.role === 'admin';
  }
}

export { LoginDto, RefreshTokenDto };
