"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const chat_module_1 = require("../chat/chat.module");
const documents_module_1 = require("../documents/documents.module");
const groups_module_1 = require("../groups/groups.module");
const query_module_1 = require("../query/query.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const overview_controller_1 = require("./overview.controller");
const overview_service_1 = require("./overview.service");
let OverviewModule = class OverviewModule {
};
exports.OverviewModule = OverviewModule;
exports.OverviewModule = OverviewModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            groups_module_1.GroupsModule,
            documents_module_1.DocumentsModule,
            query_module_1.QueryModule,
            chat_module_1.ChatModule,
            subscriptions_module_1.SubscriptionsModule,
        ],
        controllers: [overview_controller_1.OverviewController],
        providers: [overview_service_1.OverviewService],
    })
], OverviewModule);
//# sourceMappingURL=overview.module.js.map