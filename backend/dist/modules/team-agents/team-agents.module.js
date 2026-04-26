"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamAgentsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const groups_module_1 = require("../groups/groups.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const team_agents_service_1 = require("./team-agents.service");
let TeamAgentsModule = class TeamAgentsModule {
};
exports.TeamAgentsModule = TeamAgentsModule;
exports.TeamAgentsModule = TeamAgentsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, (0, common_1.forwardRef)(() => groups_module_1.GroupsModule), subscriptions_module_1.SubscriptionsModule],
        providers: [team_agents_service_1.TeamAgentsService],
        exports: [team_agents_service_1.TeamAgentsService],
    })
], TeamAgentsModule);
//# sourceMappingURL=team-agents.module.js.map