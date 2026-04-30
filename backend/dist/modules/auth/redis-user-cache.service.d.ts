import { OnModuleDestroy } from '@nestjs/common';
export type CachedUser = {
    id: string;
    name: string;
    phone: string;
    role: 'admin' | 'member';
    trialEndsAt: string;
    passwordHash: string;
    subscriptionType: string;
};
export declare class RedisUserCacheService implements OnModuleDestroy {
    private readonly client;
    private connected;
    connect(): Promise<void>;
    onModuleDestroy(): void;
    isAvailable(): boolean;
    setUser(user: CachedUser): Promise<void>;
    getUserById(id: string): Promise<CachedUser | null>;
    getUserByPhone(phone: string): Promise<CachedUser | null>;
    updateUser(id: string, patch: Partial<CachedUser>): Promise<void>;
}
