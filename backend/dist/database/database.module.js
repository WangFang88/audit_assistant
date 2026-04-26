"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const group_message_entity_1 = require("./entities/group-message.entity");
const private_doc_entity_1 = require("./entities/private-doc.entity");
const private_message_entity_1 = require("./entities/private-message.entity");
const public_doc_entity_1 = require("./entities/public-doc.entity");
const query_log_entity_1 = require("./entities/query-log.entity");
const subscription_entity_1 = require("./entities/subscription.entity");
const team_member_entity_1 = require("./entities/team-member.entity");
const team_entity_1 = require("./entities/team.entity");
const user_entity_1 = require("./entities/user.entity");
const entities = [
    user_entity_1.UserEntity,
    team_entity_1.TeamEntity,
    team_member_entity_1.TeamMemberEntity,
    public_doc_entity_1.PublicDocEntity,
    private_doc_entity_1.PrivateDocEntity,
    group_message_entity_1.GroupMessageEntity,
    private_message_entity_1.PrivateMessageEntity,
    subscription_entity_1.SubscriptionEntity,
    query_log_entity_1.QueryLogEntity,
];
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
                username: process.env.DB_USER ?? 'postgres',
                password: process.env.DB_PASSWORD ?? 'postgres',
                database: process.env.DB_NAME ?? 'audit_assistant',
                entities,
                synchronize: process.env.DB_SYNC === 'true',
                autoLoadEntities: false,
            }),
            typeorm_1.TypeOrmModule.forFeature(entities),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map