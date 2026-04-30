import { createHash } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { IsString, Matches, MinLength, MaxLength } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUserRepository, AuthUserSnapshot } from '../../database/repositories/auth-user.repository';
import { UserEntity } from '../../database/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { LocalStateService } from '../subscriptions/local-state.service';

class LoginDto {
  @IsString({ message: '账号不能为空' })
  @MinLength(3, { message: '账号至少需要 3 位' })
  phone!: string;

  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要 6 位' })
  password!: string;
}

class RefreshTokenDto {
  @IsString({ message: 'refreshToken 不能为空' })
  @MinLength(6, { message: 'refreshToken 格式错误' })
  refreshToken!: string;
}

class RegisterDto {
  @IsString({ message: '手机号不能为空' })
  @Matches(/^[\d\s\-()]{11,20}$/, { message: '请输入有效的手机号' })
  phone!: string;

  @IsString({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要 6 位' })
  password!: string;
}

class UpdateProfileDto {
  @IsString({ message: '姓名不能为空' })
  @MinLength(2, { message: '姓名至少需要 2 个字符' })
  @MaxLength(20, { message: '姓名最多 20 个字符' })
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
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly auditService: AuditService,
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
    setImmediate(() => this.syncUsersToDatabase());
  }

  private readonly demoUsers: AuthUserRecord[] = [
    {
      id: 'user-1',
      name: '系统管理员',
      phone: '13800138000',
      role: 'admin',
      trialEndsAt: '2099-12-31',
      passwordHash: createHash('sha256').update('123456').digest('hex'),
      subscriptionType: 'admin-preview',
    },
  ];

  private registeredUsers: AuthUserRecord[] = [];
  private readonly userStorage = new AsyncLocalStorage<DemoUser>();

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
          trialEndsAt: (entity.subscriptionExpiredAt ?? new Date(`${this.getDefaultTrialEndsAt()}T00:00:00.000Z`)).toISOString().slice(0, 10),
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
    return user;
  }

  private buildAuthResponse(user: AuthUserRecord) {
    const publicUser = this.toPublicUser(user);
    return {
      accessToken: this.buildAccessToken(user.id),
      refreshToken: this.buildRefreshToken(user.id),
      user: publicUser,
    };
  }

  private createUserName(phone: string) {
    return `新用户${phone.slice(-4)}`;
  }

  private getDefaultTrialEndsAt(baseDate: Date = new Date()) {
    const nextDate = new Date(baseDate.getTime());
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    return nextDate.toISOString().slice(0, 10);
  }

  async login(dto: LoginDto) {
    const user = this.findUserByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('账号不存在，请先注册后再登录');
    }

    if (!this.verifyPassword(user, dto.password)) {
      throw new UnauthorizedException('密码错误，请重新输入');
    }

    this.upgradeLegacyPassword(user);
    const response = this.buildAuthResponse(user);
    await this.auditService.recordEvent({
      eventType: 'auth.login',
      actorUserId: user.id,
      actorName: user.name,
      targetType: 'user',
      targetId: user.id,
      summary: '登录了系统',
      detail: { role: user.role },
    });
    return response;
  }

  async register(dto: RegisterDto) {
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
      trialEndsAt: this.getDefaultTrialEndsAt(),
      passwordHash,
      subscriptionType: 'free',
    };

    this.registeredUsers = [...this.registeredUsers, user];
    this.persistUsers();
    await this.userRepository.upsert(
      { id: user.id, phone: user.phone, nickname: user.name, passwordHash: user.passwordHash ?? '', role: 'member' },
      ['id'],
    ).catch(() => {});
    const response = this.buildAuthResponse(user);
    await this.auditService.recordEvent({
      eventType: 'auth.register',
      actorUserId: user.id,
      actorName: user.name,
      targetType: 'user',
      targetId: user.id,
      summary: '注册并开通了试用账号',
      detail: { phone: user.phone, trialEndsAt: user.trialEndsAt },
    });
    return response;
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

    return this.toPublicUser(user);
  }

  me() {
    const user = this.userStorage.getStore();
    if (!user) {
      throw new UnauthorizedException('未登录');
    }
    return user;
  }

  runWithUser<T>(user: DemoUser, fn: () => T): T {
    return this.userStorage.run(user, fn);
  }

  getUserByPhone(phone: string) {
    return this.findUserByPhone(phone);
  }

  getUserById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async updateProfile(dto: UpdateProfileDto) {
    const currentUser = this.me();
    const user = this.users.find((u) => u.id === currentUser.id);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    user.name = dto.name;
    this.persistUsers();
    await this.userRepository.update({ id: currentUser.id }, { nickname: dto.name }).catch(() => {});
    return { ...currentUser, name: dto.name };
  }


  private async syncUsersToDatabase() {
    for (const user of this.users) {
      await this.userRepository.upsert(
        { id: user.id, phone: user.phone, nickname: user.name, passwordHash: user.passwordHash ?? '', role: user.role as 'admin' | 'member' },
        ['id'],
      ).catch(() => {});
    }
  }

  isAdmin() {
    return this.me().role === 'admin';
  }
}

export { LoginDto, RefreshTokenDto, RegisterDto, UpdateProfileDto };
