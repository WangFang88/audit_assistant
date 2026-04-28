"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryModule = void 0;
const common_1 = require("@nestjs/common");
const database_support_module_1 = require("../../database/database-support.module");
const auth_module_1 = require("../auth/auth.module");
const audit_module_1 = require("../audit/audit.module");
const documents_module_1 = require("../documents/documents.module");
const groups_module_1 = require("../groups/groups.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const team_agents_module_1 = require("../team-agents/team-agents.module");
const query_controller_1 = require("./query.controller");
const query_service_1 = require("./query.service");
const qwen_service_1 = require("./qwen.service");
let QueryModule = class QueryModule {
};
exports.QueryModule = QueryModule;
exports.QueryModule = QueryModule = __decorate([
    (0, common_1.Module)({
        imports: [database_support_module_1.DatabaseSupportModule, auth_module_1.AuthModule, audit_module_1.AuditModule, documents_module_1.DocumentsModule, groups_module_1.GroupsModule, subscriptions_module_1.SubscriptionsModule, team_agents_module_1.TeamAgentsModule],
        controllers: [query_controller_1.QueryController],
        providers: [query_service_1.QueryService, qwen_service_1.QwenService],
        exports: [query_service_1.QueryService],
    })
], QueryModule);
//# sourceMappingURL=query.module.js.map