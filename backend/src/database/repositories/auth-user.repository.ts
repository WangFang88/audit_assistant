import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

export type AuthUserSnapshot = {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  trialEndsAt: string;
  passwordHash: string;
  subscriptionType: string;
};

@Injectable()
export class AuthUserRepository {
  mapEntityToSnapshot(entity: UserEntity): AuthUserSnapshot {
    return {
      id: entity.id,
      name: entity.nickname,
      phone: entity.phone,
      role: entity.role,
      trialEndsAt: entity.subscriptionExpiredAt?.toISOString().slice(0, 10) ?? '2026-05-01',
      passwordHash: entity.passwordHash,
      subscriptionType: entity.subscriptionType,
    };
  }

  createEntity(snapshot: AuthUserSnapshot): UserEntity {
    const entity = new UserEntity();
    entity.id = snapshot.id;
    entity.nickname = snapshot.name;
    entity.phone = snapshot.phone;
    entity.role = snapshot.role;
    entity.passwordHash = snapshot.passwordHash;
    entity.subscriptionType = snapshot.subscriptionType;
    entity.subscriptionExpiredAt = new Date(`${snapshot.trialEndsAt}T00:00:00.000Z`);
    return entity;
  }
}
