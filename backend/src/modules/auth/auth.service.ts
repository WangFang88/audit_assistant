import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IsMobilePhone, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsMobilePhone('zh-CN')
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

@Injectable()
export class AuthService {
  private readonly accessToken = 'demo-access-token';
  private readonly refreshToken = 'demo-refresh-token';

  private readonly currentUser = {
    id: 'user-1',
    name: '系统管理员',
    phone: '13800138000',
    role: 'admin',
    trialEndsAt: '2026-05-01',
  };

  login(dto: LoginDto) {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      user: {
        ...this.currentUser,
        phone: dto.phone,
      },
    };
  }

  refresh(dto: RefreshTokenDto) {
    if (dto.refreshToken != this.refreshToken) {
      throw new UnauthorizedException('Refresh token 无效');
    }

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      user: this.currentUser,
    };
  }

  validateAccessToken(token: string) {
    if (token !== this.accessToken) {
      return null;
    }

    return this.currentUser;
  }

  me() {
    return this.currentUser;
  }
}

export { LoginDto, RefreshTokenDto };
