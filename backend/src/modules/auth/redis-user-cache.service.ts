import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export type CachedUser = {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  trialEndsAt: string;
  passwordHash: string;
  subscriptionType: string;
};

@Injectable()
export class RedisUserCacheService implements OnModuleDestroy {
  private readonly client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  });

  private connected = false;

  async connect() {
    this.client.on('error', () => { this.connected = false; });
    try {
      await this.client.connect();
      this.connected = true;
    } catch {
      this.connected = false;
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  isAvailable() {
    return this.connected;
  }

  async setUser(user: CachedUser) {
    if (!this.connected) return;
    await this.client.set(`user:${user.id}`, JSON.stringify(user));
    await this.client.set(`user:phone:${user.phone}`, user.id);
  }

  async getUserById(id: string): Promise<CachedUser | null> {
    if (!this.connected) return null;
    const data = await this.client.get(`user:${id}`);
    return data ? (JSON.parse(data) as CachedUser) : null;
  }

  async getUserByPhone(phone: string): Promise<CachedUser | null> {
    if (!this.connected) return null;
    const id = await this.client.get(`user:phone:${phone}`);
    if (!id) return null;
    return this.getUserById(id);
  }

  async updateUser(id: string, patch: Partial<CachedUser>) {
    if (!this.connected) return;
    const existing = await this.getUserById(id);
    if (!existing) return;
    await this.setUser({ ...existing, ...patch });
  }
}
