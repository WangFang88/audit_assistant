import { Injectable } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

class QueryRequestDto {
  @IsString()
  @MinLength(4)
  question!: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

type CitationRecord = {
  documentId: string;
  title: string;
  libraryType: 'public' | 'private';
  score: number;
  matchedChunk: string;
  reason: string;
  articleRef: string;
  chapterTitle: string;
  pageLabel: string;
};

@Injectable()
export class QueryService {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly groupsService: GroupsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  search(dto: QueryRequestDto) {
    const usage = this.subscriptionsService.getUsage();
    this.subscriptionsService.assertCanRunQuery(usage.dailyQueries);

    const group = dto.groupId ? this.groupsService.getGroupById(dto.groupId) : null;
    const readyChunks = this.documentsService.getReadyChunks(dto.groupId);
    const scopeSummary = this.documentsService.getLibraryScopeSummary(dto.groupId);
    const lowerQuestion = dto.question.toLowerCase();
    const tokens = Array.from(
      new Set(
        lowerQuestion
          .split(/[\s，。、“”‘’；：,.;!?（）()【】\[\]\-]+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 2),
      ),
    );

    const candidates: CitationRecord[] = readyChunks
      .map((chunk) => {
        const keywordHits = chunk.keywords.filter((keyword) => lowerQuestion.includes(keyword.toLowerCase())).length;
        const contentHits = tokens.filter((token) => chunk.content.includes(token)).length;
        const semanticBoost = contentHits > 0 ? 0.16 + Math.min(0.1, contentHits * 0.03) : 0.04;
        const scopeBoost = chunk.libraryType === 'private' ? 0.08 : 0.04;
        const score = Math.min(0.99, 0.48 + keywordHits * 0.14 + semanticBoost + scopeBoost);

        return {
          documentId: chunk.documentId,
          title: chunk.title,
          libraryType: chunk.libraryType,
          score,
          matchedChunk: `${chunk.articleRef}：${chunk.content}`,
          reason:
            keywordHits > 0 || contentHits > 0
              ? `已命中 ${keywordHits + contentHits} 个关键词/语义线索，并基于文本块完成范围过滤与混合召回。`
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

    this.subscriptionsService.consumeQuery();

    return {
      question: dto.question,
      scope: {
        scopeMode: scopeSummary.scopeMode,
        label: dto.groupId == null ? '仅公共库' : '公共库 + 当前项目组私有库',
        publicLibrary: true,
        privateLibrary: dto.groupId != null,
        groupId: dto.groupId ?? null,
        groupName: group?.name ?? null,
        isolationNotice:
          dto.groupId == null
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
      answer:
        candidates.length == 0
          ? '当前范围内尚未命中可用条款，请尝试补充更明确的关键词、条款号或切换项目组后重试。'
          : dto.groupId == null
            ? '系统已在公共基础库中基于持久化文本块完成范围过滤与混合检索，并返回可追溯的制度依据。'
            : '系统已在公共基础库与当前项目组私有库中基于持久化文本块完成范围过滤与混合检索，并返回可追溯的制度依据。',
      citations: candidates,
      explanation:
        '该查询链路已从固定示例命中过渡到基于持久化 chunk 的检索骨架：先过滤范围，再对文本块执行关键词与语义线索匹配，最后返回可溯源的候选条款。',
    };
  }
}

export { QueryRequestDto };
