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
const audit_event_entity_1 = require("./entities/audit-event.entity");
const conversation_participant_entity_1 = require("./entities/conversation-participant.entity");
const conversation_entity_1 = require("./entities/conversation.entity");
const document_chunk_entity_1 = require("./entities/document-chunk.entity");
const document_entity_1 = require("./entities/document.entity");
const document_extraction_job_entity_1 = require("./entities/document-extraction-job.entity");
const message_entity_1 = require("./entities/message.entity");
const query_log_entity_1 = require("./entities/query-log.entity");
const subscription_entity_1 = require("./entities/subscription.entity");
const team_agent_entity_1 = require("./entities/team-agent.entity");
const team_member_entity_1 = require("./entities/team-member.entity");
const team_entity_1 = require("./entities/team.entity");
const user_entity_1 = require("./entities/user.entity");
const entities = [
    user_entity_1.UserEntity,
    audit_event_entity_1.AuditEventEntity,
    team_entity_1.TeamEntity,
    team_member_entity_1.TeamMemberEntity,
    team_agent_entity_1.TeamAgentEntity,
    document_entity_1.DocumentEntity,
    document_chunk_entity_1.DocumentChunkEntity,
    document_extraction_job_entity_1.DocumentExtractionJobEntity,
    conversation_entity_1.ConversationEntity,
    conversation_participant_entity_1.ConversationParticipantEntity,
    message_entity_1.MessageEntity,
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