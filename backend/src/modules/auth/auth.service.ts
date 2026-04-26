import { Injectable } from '@nestjs/common';
import { IsMobilePhone, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsMobilePhone('zh-CN')
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Injectable()
export class AuthService {
  private readonly accessToken = 'demo-access-token';

  private readonly currentUser = {
    id: 'user-1',
    name: '审计专员',
    phone: '13800138000',
    role: 'project_leader',
    trialEndsAt: '2026-05-01',
  };

  login(dto: LoginDto) {
    return {
      accessToken: this.accessToken,
      refreshToken: 'demo-refresh-token',
      user: {
        ...this.currentUser,
        phone: dto.phone,
      },
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

export { LoginDto };
