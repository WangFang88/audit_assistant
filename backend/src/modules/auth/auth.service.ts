import { createHash } from 'crypto';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserRepository, AuthUserSnapshot } from '../../database/repositories/auth-user.repository';
import { UserEntity } from '../../database/entities/user.entity';
import { LocalStateService } from '../subscriptions/local-state.service';

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

class RegisterDto {
  @IsString()
  @Matches(/^[\d\s\-()]{11,20}$/)
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name!: string;
}

type DemoUser = {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  trialEndsAt: string;
};

type AuthUserRecord = DemoUser & {
  passwordHash: string;
  passwordIsLegacyPlaintext?: boolean;
  subscriptionType: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly localStateService: LocalStateService,
    private readonly authUserRepository: AuthUserRepository,
  ) {
    const persistedUsers = this.localStateService.readState().users;
    if (persistedUsers && persistedUsers.length > 0) {
      this.registeredUsers = persistedUsers
        .filter((user) => !this.demoUsers.some((demoUser) => demoUser.id === user.id))
        .map((user) => ({
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          trialEndsAt: user.trialEndsAt,
          passwordHash: user.passwordHash ?? user.password ?? '',
          passwordIsLegacyPlaintext: user.passwordHash == null,
          subscriptionType: 'free',
        }));
    }
  }

  private readonly demoUsers: AuthUserRecord[] = [
    {
      id: 'user-1',
      name: '系统管理员',
      phone: '13800138000',
      role: 'admin',
      trialEndsAt: '2026-05-01',
      passwordHash: createHash('sha256').update('123456').digest('hex'),
      subscriptionType: 'admin-preview',
    },
    {
      id: 'user-2',
      name: '审计组长',
      phone: '13800138001',
      role: 'member',
      trialEndsAt: '2026-05-01',
      passwordHash: createHash('sha256').update('123456').digest('hex'),
      subscriptionType: 'free',
    },
    {
      id: 'user-3',
      name: '审计助理',
      phone: '13800138002',
      role: 'member',
      trialEndsAt: '2026-05-01',
      passwordHash: createHash('sha256').update('123456').digest('hex'),
      subscriptionType: 'free',
    },
    {
      id: 'user-4',
      name: '法规顾问',
      phone: '13800138003',
      role: 'member',
      trialEndsAt: '2026-05-01',
      passwordHash: createHash('sha256').update('123456').digest('hex'),
      subscriptionType: 'free',
    },
  ];

  private registeredUsers: AuthUserRecord[] = [];
  private currentUser: DemoUser = this.toPublicUser(this.demoUsers[0]);

  private get users() {
    return [...this.demoUsers, ...this.registeredUsers];
  }

  private toSnapshot(user: AuthUserRecord): AuthUserSnapshot {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      trialEndsAt: user.trialEndsAt,
      passwordHash: user.passwordHash,
      subscriptionType: user.subscriptionType,
    };
  }

  private fromSnapshot(snapshot: AuthUserSnapshot): AuthUserRecord {
    return {
      id: snapshot.id,
      name: snapshot.name,
      phone: snapshot.phone,
      role: snapshot.role,
      trialEndsAt: snapshot.trialEndsAt,
      passwordHash: snapshot.passwordHash,
      subscriptionType: snapshot.subscriptionType,
    };
  }

  private toPublicUser(user: AuthUserRecord): DemoUser {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      trialEndsAt: user.trialEndsAt,
    };
  }

  private persistUsers() {
    this.localStateService.saveUsers(
      this.registeredUsers.map((user) => {
        const entity = this.authUserRepository.createEntity(this.toSnapshot(user));
        return {
          id: entity.id,
          name: entity.nickname,
          phone: entity.phone,
          role: entity.role,
          trialEndsAt: (entity.subscriptionExpiredAt ?? new Date('2026-05-01T00:00:00.000Z')).toISOString().slice(0, 10),
          passwordHash: entity.passwordHash,
        };
      }),
    );
  }

  private hashPassword(password: string) {
    return createHash('sha256').update(password).digest('hex');
  }

  private verifyPassword(user: AuthUserRecord, password: string) {
    const normalizedPassword = password.trim();
    if (user.passwordIsLegacyPlaintext) {
      return user.passwordHash === normalizedPassword;
    }

    return user.passwordHash === this.hashPassword(normalizedPassword);
  }

  private upgradeLegacyPassword(user: AuthUserRecord) {
    if (!user.passwordIsLegacyPlaintext) {
      return;
    }

    user.passwordHash = this.hashPassword(user.passwordHash);
    user.passwordIsLegacyPlaintext = false;
    this.persistUsers();
  }

  private buildAccessToken(userId: string) {
    return `demo-access-token-${userId}`;
  }

  private buildRefreshToken(userId: string) {
    return `demo-refresh-token-${userId}`;
  }

  private normalizePhone(phone: string) {
    return phone.trim().replace(/[-\s()]/g, '');
  }

  private findUserByPhone(phone: string) {
    const normalizedPhone = this.normalizePhone(phone);
    return this.users.find((user) => user.phone === normalizedPhone || (normalizedPhone === 'admin' && user.role === 'admin')) ?? null;
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

  private buildAuthResponse(user: AuthUserRecord) {
    const publicUser = this.toPublicUser(user);
    this.setCurrentUser(publicUser);
    return {
      accessToken: this.buildAccessToken(user.id),
      refreshToken: this.buildRefreshToken(user.id),
      user: publicUser,
    };
  }

  private createUserName(phone: string) {
    return `新用户${phone.slice(-4)}`;
  }

  login(dto: LoginDto) {
    const user = this.findUserByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('账号不存在，请先注册后再登录');
    }

    if (!this.verifyPassword(user, dto.password)) {
      throw new UnauthorizedException('密码错误，请重新输入');
    }

    this.upgradeLegacyPassword(user);
    return this.buildAuthResponse(user);
  }

  register(dto: RegisterDto) {
    const phone = this.normalizePhone(dto.phone);
    const passwordHash = this.hashPassword(dto.password.trim());
    if (phone === 'admin') {
      throw new BadRequestException('admin 为保留账号，不能用于注册');
    }

    if (this.findUserByPhone(phone)) {
      throw new BadRequestException('该手机号已注册，请直接登录');
    }

    const user: AuthUserRecord = {
      id: `user-${Date.now()}`,
      name: this.createUserName(phone),
      phone,
      role: 'member',
      trialEndsAt: '2026-05-01',
      passwordHash,
      subscriptionType: 'free',
    };

    this.registeredUsers = [...this.registeredUsers, user];
    this.persistUsers();
    return this.buildAuthResponse(user);
  }

  refresh(dto: RefreshTokenDto) {
    const user = this.findUserByToken(dto.refreshToken, 'demo-refresh-token-');
    if (!user) {
      throw new UnauthorizedException('Refresh token 无效');
    }

    return this.buildAuthResponse(user);
  }

  validateAccessToken(token: string) {
    const user = this.findUserByToken(token, 'demo-access-token-');
    if (!user) {
      return null;
    }

    return this.setCurrentUser(this.toPublicUser(user));
  }

  me() {
    return this.currentUser;
  }

  getUserByPhone(phone: string) {
    return this.findUserByPhone(phone);
  }

  updateProfile(dto: UpdateProfileDto) {
    const user = this.users.find((u) => u.id === this.currentUser.id);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    user.name = dto.name;
    this.currentUser = { ...this.currentUser, name: dto.name };
    return this.currentUser;
  }

  isAdmin() {
    return this.currentUser.role === 'admin';
  }
}

export { LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto };
