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
exports.QueryRequestDto = exports.QueryService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const date_1 = require("../../utils/date");
const audit_service_1 = require("../audit/audit.service");
const auth_service_1 = require("../auth/auth.service");
const documents_service_1 = require("../documents/documents.service");
const embedding_service_1 = require("../documents/embedding.service");
const groups_service_1 = require("../groups/groups.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const team_agents_service_1 = require("../team-agents/team-agents.service");
const qwen_service_1 = require("./qwen.service");
class QueryRequestDto {
}
exports.QueryRequestDto = QueryRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], QueryRequestDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRequestDto.prototype, "groupId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryRequestDto.prototype, "agentId", void 0);
let QueryService = class QueryService {
    constructor(authService, documentsService, embeddingService, groupsService, subscriptionsService, teamAgentsService, qwenService, auditService) {
        this.authService = authService;
        this.documentsService = documentsService;
        this.embeddingService = embeddingService;
        this.groupsService = groupsService;
        this.subscriptionsService = subscriptionsService;
        this.teamAgentsService = teamAgentsService;
        this.qwenService = qwenService;
        this.auditService = auditService;
    }
    async search(dto, options) {
        if (this.authService.isAdmin() && (dto.groupId != null || dto.agentId != null)) {
            throw new common_1.ForbiddenException('\u7ba1\u7406\u5458\u4ec5\u53ef\u68c0\u7d22\u516c\u5171\u5e93\uff0c\u4e0d\u80fd\u6309\u9879\u76ee\u7ec4\u8303\u56f4\u68c0\u7d22');
        }
        const resolvedGroupId = await this.teamAgentsService.resolveGroupId(dto.agentId, dto.groupId);
        if (!this.authService.isAdmin() && resolvedGroupId != null) {
            await this.groupsService.assertCanAccessGroup(resolvedGroupId);
        }
        const usage = await this.subscriptionsService.getUsage();
        if (!options?.skipAccounting) {
            await this.subscriptionsService.assertCanRunQuery(usage.dailyQueries);
        }
        const group = resolvedGroupId ? await this.groupsService.getGroupById(resolvedGroupId) : null;
        const teamAgent = resolvedGroupId ? await this.teamAgentsService.getVisibleAgentByGroupId(resolvedGroupId) : null;
        const readyChunks = await this.documentsService.getReadyChunks(resolvedGroupId);
        const scopeSummary = await this.documentsService.getLibraryScopeSummary(resolvedGroupId);
        const lowerQuestion = dto.question.toLowerCase();
        const tokens = Array.from(new Set(lowerQuestion
            .split(/[\s\uff0c\u3002\u3001\u201c\u201d\u2018\u2019\uff1b\uff1a,.;!?\uff08\uff09()[\]\-]+/)
            .map((token) => token.trim())
            .filter((token) => token.length >= 2)));
        const questionEmbedding = await this.embeddingService.embed(dto.question);
        const candidates = readyChunks
            .map((chunk) => {
            const keywordHits = chunk.keywords.filter((kw) => lowerQuestion.includes(kw.toLowerCase())).length;
            const contentHits = tokens.filter((t) => chunk.content.includes(t)).length;
            const scopeBoost = chunk.libraryType === 'private' ? 0.05 : 0.02;
            let score;
            if (questionEmbedding && chunk.embedding) {
                const cosine = this.embeddingService.cosineSimilarity(questionEmbedding, chunk.embedding);
                score = Math.min(0.99, (cosine + 1) / 2 + keywordHits * 0.03 + scopeBoost);
            }
            else {
                const articleTokens = tokens.filter((t) => /\u7b2c.+\u6761|\u7b2c.+\u7ae0/.test(t));
                const evidenceTokens = tokens.filter((t) => ['\u5408\u540c', '\u53d1\u7968', '\u9a8c\u6536', '\u4ed8\u6b3e', '\u51ed\u8bc1', '\u4f9d\u636e', '\u5f52\u6863'].includes(t));
                const articleHits = articleTokens.filter((t) => chunk.articleRef.includes(t) || chunk.chapterTitle.includes(t)).length;
                const evidenceHits = evidenceTokens.filter((t) => chunk.content.includes(t)).length;
                const semanticBoost = contentHits > 0 ? 0.16 + Math.min(0.1, contentHits * 0.03) : 0.04;
                score = Math.min(0.99, 0.42 + keywordHits * 0.14 + semanticBoost + articleHits * 0.1 + evidenceHits * 0.08 + scopeBoost);
            }
            const matchedSignals = keywordHits + contentHits;
            const hasVector = questionEmbedding && chunk.embedding;
            return {
                documentId: chunk.documentId,
                title: chunk.title,
                libraryType: chunk.libraryType,
                score,
                matchedChunk: chunk.chapterTitle + ' ' + chunk.articleRef + '\uff1a' + chunk.content,
                reason: hasVector
                    ? '\u5411\u91cf\u76f8\u4f3c\u5ea6 ' + ((score - scopeBoost) * 100).toFixed(1) + '%\uff0c\u547d\u4e2d ' + matchedSignals + ' \u4e2a\u5173\u952e\u8bcd\u3002'
                    : matchedSignals > 0
                        ? '\u5df2\u547d\u4e2d ' + matchedSignals + ' \u4e2a\u5173\u952e\u8bcd/\u6761\u6b3e\u53f7\uff0c\u57fa\u4e8e\u5173\u952e\u8bcd\u6df7\u5408\u53ec\u56de\u3002'
                        : '\u5f53\u524d\u6587\u672c\u5757\u901a\u8fc7\u8303\u56f4\u8fc7\u6ee4\u8fdb\u5165\u5019\u9009\u96c6\u3002',
                articleRef: chunk.articleRef,
                chapterTitle: chunk.chapterTitle,
                pageLabel: chunk.pageLabel,
            };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
        const queryMode = questionEmbedding
            ? '\u5411\u91cf\u68c0\u7d22 + \u5173\u952e\u8bcd\u878d\u5408'
            : tokens.length === 0
                ? '\u8303\u56f4\u4f18\u5148 + \u8bed\u4e49\u91cd\u6392'
                : '\u5173\u952e\u8bcd + \u8bed\u4e49\u878d\u5408';
        const publicHits = candidates.filter((c) => c.libraryType === 'public').length;
        const privateHits = candidates.filter((c) => c.libraryType === 'private').length;
        if (!options?.skipAccounting) {
            this.subscriptionsService.recordQueryLog({
                id: 'query-log-' + Date.now(),
                userId: this.authService.me().id,
                teamId: resolvedGroupId ?? null,
                queryText: dto.question,
                queriedAt: (0, date_1.formatCst)(new Date()),
                consumedQuota: 1,
            });
        }
        const fallbackAnswer = candidates.length === 0
            ? '\u5f53\u524d\u8303\u56f4\u5185\u5c1a\u672a\u547d\u4e2d\u53ef\u7528\u6761\u6b3e\uff0c\u8bf7\u5c1d\u8bd5\u8865\u5145\u66f4\u660e\u786e\u7684\u5173\u952e\u8bcd\u3001\u6761\u6b3e\u53f7\u6216\u5207\u6362\u9879\u76ee\u7ec4\u540e\u91cd\u8bd5\u3002'
            : null;
        const qwenAnswer = fallbackAnswer == null
            ? await this.qwenService.generate(dto.question, candidates.map((c) => `【${c.title}】${c.matchedChunk}`))
            : null;
        const answer = fallbackAnswer ?? qwenAnswer ?? '\u68c0\u7d22\u5b8c\u6210\uff0c\u8bf7\u67e5\u770b\u4e0b\u65b9\u5f15\u7528\u6761\u6b3e\u3002';
        if (!options?.skipAccounting) {
            const user = this.authService.me();
            await this.auditService.recordEvent({
                eventType: 'query.search',
                actorUserId: user.id,
                actorName: user.name,
                targetType: 'query',
                groupId: resolvedGroupId ?? null,
                summary: resolvedGroupId == null ? '发起了公共库制度检索' : '发起了项目组制度检索',
                detail: {
                    question: dto.question,
                    agentId: dto.agentId ?? null,
                    returnedCitations: candidates.length,
                    queryMode,
                },
            });
        }
        return {
            question: dto.question,
            agentMode: dto.agentId != null,
            agent: teamAgent == null
                ? null
                : {
                    id: teamAgent.id,
                    name: teamAgent.name,
                    groupId: teamAgent.groupId,
                    capabilities: teamAgent.capabilities,
                    defaultConversationId: teamAgent.defaultConversationId,
                    retrievalScope: teamAgent.config.retrievalScope,
                },
            scope: {
                scopeMode: scopeSummary.scopeMode,
                label: resolvedGroupId == null ? '\u4ec5\u516c\u5171\u5e93' : '\u516c\u5171\u5e93 + \u5f53\u524d\u9879\u76ee\u7ec4\u79c1\u6709\u5e93',
                publicLibrary: true,
                privateLibrary: resolvedGroupId != null,
                groupId: resolvedGroupId ?? null,
                groupName: group?.name ?? null,
                isolationNotice: resolvedGroupId == null
                    ? '\u5f53\u524d\u672a\u9009\u62e9\u9879\u76ee\u7ec4\uff0c\u4ec5\u68c0\u7d22\u516c\u5171\u57fa\u7840\u5e93\u3002'
                    : '\u4ec5\u68c0\u7d22\u5f53\u524d\u9879\u76ee\u7ec4\u79c1\u6709\u5e93\uff0c\u4e0d\u8de8\u9879\u76ee\u7ec4\u8bfb\u53d6\u79c1\u6709\u8d44\u6599\u3002',
            },
            pipeline: [
                '\u8303\u56f4\u8fc7\u6ee4',
                '\u5173\u952e\u8bcd\u53ec\u56de',
                questionEmbedding ? '\u5411\u91cf\u68c0\u7d22\uff08bge-large-zh\uff09' : '\u8bed\u4e49\u53ec\u56de',
                '\u878d\u5408\u91cd\u6392',
                '\u963f\u91cc\u5343\u95ee\u751f\u6210\uff08\u76ee\u6807\uff09',
            ],
            retrievalStats: {
                queryMode,
                tokenCount: tokens.length,
                candidateChunks: readyChunks.length,
                returnedCitations: candidates.length,
                publicLibraryHits: publicHits,
                privateLibraryHits: privateHits,
            },
            ragMeta: {
                retrievalMode: 'hybrid',
                generationProviderTarget: 'Qwen',
                prototypeMode: 'chunk-indexed-prototype',
                answerTraceable: true,
            },
            answer,
            citations: candidates,
            explanation: '\u8be5\u67e5\u8be2\u94fe\u8def\u5df2\u4ece\u56fa\u5b9a\u793a\u4f8b\u547d\u4e2d\u8fc7\u6e21\u5230\u57fa\u4e8e\u6301\u4e45\u5316 chunk \u7684\u68c0\u7d22\u9aa8\u67b6\uff1a\u5148\u8fc7\u6ee4\u8303\u56f4\uff0c\u518d\u5bf9\u6587\u672c\u5757\u6267\u884c\u5173\u952e\u8bcd\u4e0e\u8bed\u4e49\u7ebf\u7d22\u5339\u914d\uff0c\u6700\u540e\u8fd4\u56de\u53ef\u6eaf\u6e90\u7684\u5019\u9009\u6761\u6b3e\u3002',
        };
    }
};
exports.QueryService = QueryService;
exports.QueryService = QueryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        documents_service_1.DocumentsService,
        embedding_service_1.EmbeddingService,
        groups_service_1.GroupsService,
        subscriptions_service_1.SubscriptionsService,
        team_agents_service_1.TeamAgentsService,
        qwen_service_1.QwenService,
        audit_service_1.AuditService])
], QueryService);
//# sourceMappingURL=query.service.js.map