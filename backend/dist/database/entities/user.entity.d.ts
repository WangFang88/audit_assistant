export declare class UserEntity {
    id: string;
    phone: string;
    passwordHash: string;
    nickname: string;
    registeredAt: Date;
    subscriptionType: string;
    subscriptionExpiredAt: Date | null;
    role: 'admin' | 'member';
}
