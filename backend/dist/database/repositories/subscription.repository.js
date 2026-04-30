"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRepository = void 0;
const common_1 = require("@nestjs/common");
const subscription_entity_1 = require("../entities/subscription.entity");
const date_1 = require("../../utils/date");
let SubscriptionRepository = class SubscriptionRepository {
    createEntity(snapshot) {
        const entity = new subscription_entity_1.SubscriptionEntity();
        entity.id = snapshot.id;
        entity.userId = snapshot.userId;
        entity.planType = snapshot.planType;
        entity.amount = snapshot.amount;
        entity.paidAt = new Date(snapshot.paidAt.replace(' ', 'T'));
        entity.expiredAt = new Date(snapshot.expiredAt.replace(' ', 'T'));
        return entity;
    }
    mapEntity(entity) {
        return {
            id: entity.id,
            userId: entity.userId,
            planType: this.normalizePlanType(entity.planType),
            amount: entity.amount,
            paidAt: this.formatDateTime(entity.paidAt),
            expiredAt: this.formatDateTime(entity.expiredAt),
        };
    }
    normalizePlanType(planType) {
        if (planType === 'weekly' || planType === 'monthly' || planType === 'yearly') {
            return planType;
        }
        return 'free';
    }
    formatDateTime(date) {
        return (0, date_1.formatCst)(date, false);
    }
};
exports.SubscriptionRepository = SubscriptionRepository;
exports.SubscriptionRepository = SubscriptionRepository = __decorate([
    (0, common_1.Injectable)()
], SubscriptionRepository);
//# sourceMappingURL=subscription.repository.js.map