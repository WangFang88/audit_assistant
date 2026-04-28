"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const team_member_entity_1 = require("../../database/entities/team-member.entity");
const auth_service_1 = require("../auth/auth.service");
const subscriptions_service_1 = require("./subscriptions.service");
let SubscriptionsController = class SubscriptionsController {
    constructor(subscriptionsService, authService, teamMemberRepository) {
        this.subscriptionsService = subscriptionsService;
        this.authService = authService;
        this.teamMemberRepository = teamMemberRepository;
    }
    async getOverview() {
        const currentUser = this.authService.me();
        const memberships = await this.teamMemberRepository.findBy({ userId: currentUser.id, role: 'leader' });
        return this.subscriptionsService.getOverview(memberships.length);
    }
    async createOrder(dto) {
        return this.subscriptionsService.createSubscriptionOrder(dto);
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [subscriptions_service_1.CreateSubscriptionOrderDto]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createOrder", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('subscriptions'),
    __param(2, (0, typeorm_1.InjectRepository)(team_member_entity_1.TeamMemberEntity)),
    __metadata("design:paramtypes", [subscriptions_service_1.SubscriptionsService,
        auth_service_1.AuthService,
        typeorm_2.Repository])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map