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
export declare class AuthUserRepository {
    mapEntityToSnapshot(entity: UserEntity): AuthUserSnapshot;
    createEntity(snapshot: AuthUserSnapshot): UserEntity;
}
