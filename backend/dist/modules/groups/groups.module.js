"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const team_member_entity_1 = require("../../database/entities/team-member.entity");
const team_entity_1 = require("../../database/entities/team.entity");
const database_support_module_1 = require("../../database/database-support.module");
const auth_module_1 = require("../auth/auth.module");
const chat_module_1 = require("../chat/chat.module");
const documents_module_1 = require("../documents/documents.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const team_agents_module_1 = require("../team-agents/team-agents.module");
const groups_controller_1 = require("./groups.controller");
const groups_service_1 = require("./groups.service");
let GroupsModule = class GroupsModule {
};
exports.GroupsModule = GroupsModule;
exports.GroupsModule = GroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([team_entity_1.TeamEntity, team_member_entity_1.TeamMemberEntity]),
            database_support_module_1.DatabaseSupportModule,
            auth_module_1.AuthModule,
            subscriptions_module_1.SubscriptionsModule,
            (0, common_1.forwardRef)(() => documents_module_1.DocumentsModule),
            (0, common_1.forwardRef)(() => chat_module_1.ChatModule),
            (0, common_1.forwardRef)(() => team_agents_module_1.TeamAgentsModule),
        ],
        controllers: [groups_controller_1.GroupsController],
        providers: [groups_service_1.GroupsService],
        exports: [groups_service_1.GroupsService],
    })
], GroupsModule);
//# sourceMappingURL=groups.module.js.map