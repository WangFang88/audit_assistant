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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverviewService = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const chat_service_1 = require("../chat/chat.service");
const documents_service_1 = require("../documents/documents.service");
const groups_service_1 = require("../groups/groups.service");
const query_service_1 = require("../query/query.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
let OverviewService = class OverviewService {
    constructor(authService, groupsService, documentsService, queryService, chatService, subscriptionsService) {
        this.authService = authService;
        this.groupsService = groupsService;
        this.documentsService = documentsService;
        this.queryService = queryService;
        this.chatService = chatService;
        this.subscriptionsService = subscriptionsService;
    }
    getDashboard(groupId) {
        const groups = this.groupsService.listGroups();
        const effectiveGroupId = groupId ?? groups[0]?.id;
        return {
            user: this.authService.me(),
            groups,
            members: effectiveGroupId ? this.groupsService.listMembers(effectiveGroupId) : [],
            documents: this.documentsService.listDocuments(effectiveGroupId),
            extractJobs: this.documentsService.listExtractionJobs(),
            subscription: this.subscriptionsService.getOverview(),
            conversations: this.chatService.listConversations(),
            featuredQuery: this.queryService.search({
                question: '请检索与专项资金使用和采购审批相关的制度依据。',
                groupId: effectiveGroupId,
            }),
        };
    }
};
exports.OverviewService = OverviewService;
exports.OverviewService = OverviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        groups_service_1.GroupsService,
        documents_service_1.DocumentsService,
        query_service_1.QueryService,
        chat_service_1.ChatService,
        subscriptions_service_1.SubscriptionsService])
], OverviewService);
//# sourceMappingURL=overview.service.js.map