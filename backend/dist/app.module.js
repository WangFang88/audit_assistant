"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const chat_module_1 = require("./modules/chat/chat.module");
const documents_module_1 = require("./modules/documents/documents.module");
const groups_module_1 = require("./modules/groups/groups.module");
const overview_module_1 = require("./modules/overview/overview.module");
const query_module_1 = require("./modules/query/query.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            groups_module_1.GroupsModule,
            documents_module_1.DocumentsModule,
            query_module_1.QueryModule,
            chat_module_1.ChatModule,
            subscriptions_module_1.SubscriptionsModule,
            overview_module_1.OverviewModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map