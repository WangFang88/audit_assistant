"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const database_support_module_1 = require("../../database/database-support.module");
const user_entity_1 = require("../../database/entities/user.entity");
const audit_module_1 = require("../audit/audit.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const auth_controller_1 = require("./auth.controller");
const auth_guard_1 = require("./auth.guard");
const auth_service_1 = require("./auth.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [database_support_module_1.DatabaseSupportModule, audit_module_1.AuditModule, (0, common_1.forwardRef)(() => subscriptions_module_1.SubscriptionsModule), typeorm_1.TypeOrmModule.forFeature([user_entity_1.UserEntity])],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            core_1.Reflector,
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.AuthGuard,
            },
        ],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map