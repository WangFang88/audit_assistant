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
const auth_service_1 = require("../auth/auth.service");
const documents_service_1 = require("../documents/documents.service");
const groups_service_1 = require("../groups/groups.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const team_agents_service_1 = require("../team-agents/team-agents.service");
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
    constructor(authService, documentsService, groupsService, subscriptionsService, teamAgentsService) {
        this.authService = authService;
        this.documentsService = documentsService;
        this.groupsService = groupsService;
        this.subscriptionsService = subscriptionsService;
        this.teamAgentsService = teamAgentsService;
    }
    async search(dto) {
        if (this.authService.isAdmin() && (dto.groupId != null || dto.agentId != null)) {
            throw new common_1.ForbiddenException('管理员仅可检索公共库，不能按项目组范围检索');
        }
        const resolvedGroupId = await this.teamAgentsService.resolveGroupId(dto.agentId, dto.groupId);
        if (!this.authService.isAdmin() && resolvedGroupId != null) {
            this.groupsService.assertCanAccessGroup(resolvedGroupId);
        }
        const usage = this.subscriptionsService.getUsage();
        this.subscriptionsService.assertCanRunQuery(usage.dailyQueries);
        const group = resolvedGroupId ? this.groupsService.getGroupById(resolvedGroupId) : null;
        const teamAgent = resolvedGroupId ? await this.teamAgentsService.getVisibleAgentByGroupId(resolvedGroupId) : null;
        const readyChunks = await this.documentsService.getReadyChunks(resolvedGroupId);
        const scopeSummary = await this.documentsService.getLibraryScopeSummary(resolvedGroupId);
        const lowerQuestion = dto.question.toLowerCase();
        const tokens = Array.from(new Set(lowerQuestion
            .split(/[\s，。、“”‘’；：,.;!?（）()【】\[\]\-]+/)
            .map((token) => token.trim())
            .filter((token) => token.length >= 2)));
        const articleTokens = tokens.filter((token) => /第.+条|第.+章/.test(token));
        const evidenceTokens = tokens.filter((token) => ['合同', '发票', '验收', '付款', '凭证', '依据', '归档'].includes(token));
        const candidates = readyChunks
            .map((chunk) => {
            const keywordHits = chunk.keywords.filter((keyword) => lowerQuestion.includes(keyword.toLowerCase())).length;
            const contentHits = tokens.filter((token) => chunk.content.includes(token)).length;
            const articleHits = articleTokens.filter((token) => chunk.articleRef.includes(token) || chunk.chapterTitle.includes(token)).length;
            const evidenceHits = evidenceTokens.filter((token) => chunk.content.includes(token)).length;
            const semanticBoost = contentHits > 0 ? 0.16 + Math.min(0.1, contentHits * 0.03) : 0.04;
            const articleBoost = articleHits > 0 ? 0.1 + Math.min(0.06, articleHits * 0.03) : 0;
            const evidenceBoost = evidenceHits > 0 ? 0.08 + Math.min(0.06, evidenceHits * 0.03) : 0;
            const scopeBoost = chunk.libraryType === 'private' ? 0.08 : 0.04;
            const score = Math.min(0.99, 0.42 + keywordHits * 0.14 + semanticBoost + articleBoost + evidenceBoost + scopeBoost);
            const matchedSignals = keywordHits + contentHits + articleHits + evidenceHits;
            return {
                documentId: chunk.documentId,
                title: chunk.title,
                libraryType: chunk.libraryType,
                score,
                matchedChunk: `${chunk.chapterTitle} ${chunk.articleRef}：${chunk.content}`,
                reason: matchedSignals > 0
                    ? `已命中 ${matchedSignals} 个关键词/条款号/证据线索，并基于文本块完成范围过滤与混合召回。`
                    : '当前文本块通过范围过滤进入候选集，并在重排阶段被保留。',
                articleRef: chunk.articleRef,
                chapterTitle: chunk.chapterTitle,
                pageLabel: chunk.pageLabel,
            };
        })
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
        const queryMode = tokens.length === 0 ? '范围优先 + 语义重排' : '关键词 + 语义融合';
        const publicHits = candidates.filter((candidate) => candidate.libraryType === 'public').length;
        const privateHits = candidates.filter((candidate) => candidate.libraryType === 'private').length;
        this.subscriptionsService.recordQueryLog({
            id: `query-log-${Date.now()}`,
            userId: this.authService.me().id,
            teamId: resolvedGroupId ?? null,
            queryText: dto.question,
            queriedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            consumedQuota: 1,
        });
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
                label: resolvedGroupId == null ? '仅公共库' : '公共库 + 当前项目组私有库',
                publicLibrary: true,
                privateLibrary: resolvedGroupId != null,
                groupId: resolvedGroupId ?? null,
                groupName: group?.name ?? null,
                isolationNotice: resolvedGroupId == null
                    ? '当前未选择项目组，仅检索公共基础库。'
                    : '仅检索当前项目组私有库，不跨项目组读取私有资料。',
            },
            pipeline: ['范围过滤', '关键词召回', '语义召回', '融合重排', '阿里千问生成（目标）'],
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
            answer: candidates.length == 0
                ? '当前范围内尚未命中可用条款，请尝试补充更明确的关键词、条款号或切换项目组后重试。'
                : resolvedGroupId == null
                    ? '系统已在公共基础库中基于持久化文本块完成范围过滤与混合检索，并返回可追溯的制度依据。'
                    : '系统已在公共基础库与当前项目组私有库中基于持久化文本块完成范围过滤与混合检索，并返回可追溯的制度依据。',
            citations: candidates,
            explanation: '该查询链路已从固定示例命中过渡到基于持久化 chunk 的检索骨架：先过滤范围，再对文本块执行关键词与语义线索匹配，最后返回可溯源的候选条款。',
        };
    }
};
exports.QueryService = QueryService;
exports.QueryService = QueryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        documents_service_1.DocumentsService,
        groups_service_1.GroupsService,
        subscriptions_service_1.SubscriptionsService,
        team_agents_service_1.TeamAgentsService])
], QueryService);
//# sourceMappingURL=query.service.js.map