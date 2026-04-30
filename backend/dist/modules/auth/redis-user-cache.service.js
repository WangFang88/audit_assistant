"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisUserCacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
let RedisUserCacheService = class RedisUserCacheService {
    constructor() {
        this.client = new ioredis_1.default({
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
            password: process.env.REDIS_PASSWORD,
            lazyConnect: true,
            enableOfflineQueue: false,
        });
        this.connected = false;
    }
    async connect() {
        try {
            await this.client.connect();
            this.connected = true;
        }
        catch {
            this.connected = false;
        }
    }
    onModuleDestroy() {
        this.client.disconnect();
    }
    isAvailable() {
        return this.connected;
    }
    async setUser(user) {
        if (!this.connected)
            return;
        await this.client.set(`user:${user.id}`, JSON.stringify(user));
        await this.client.set(`user:phone:${user.phone}`, user.id);
    }
    async getUserById(id) {
        if (!this.connected)
            return null;
        const data = await this.client.get(`user:${id}`);
        return data ? JSON.parse(data) : null;
    }
    async getUserByPhone(phone) {
        if (!this.connected)
            return null;
        const id = await this.client.get(`user:phone:${phone}`);
        if (!id)
            return null;
        return this.getUserById(id);
    }
    async updateUser(id, patch) {
        if (!this.connected)
            return;
        const existing = await this.getUserById(id);
        if (!existing)
            return;
        await this.setUser({ ...existing, ...patch });
    }
};
exports.RedisUserCacheService = RedisUserCacheService;
exports.RedisUserCacheService = RedisUserCacheService = __decorate([
    (0, common_1.Injectable)()
], RedisUserCacheService);
//# sourceMappingURL=redis-user-cache.service.js.map