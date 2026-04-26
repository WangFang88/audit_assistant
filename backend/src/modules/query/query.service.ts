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
    const tokens = ['采购', '资金', '审批', '合同', '验收', '预算', '支付'].filter((token) =>
      lowerQuestion.includes(token),
    );

    const candidates: CitationRecord[] = readyChunks
      .map((chunk) => {
        const keywordHits = chunk.keywords.filter((keyword) => lowerQuestion.includes(keyword)).length;
        const semanticBoost = tokens.some((token) => chunk.content.includes(token)) ? 0.2 : 0.05;
        const scopeBoost = chunk.libraryType === 'private' ? 0.08 : 0.04;
        const score = Math.min(0.99, 0.55 + keywordHits * 0.12 + semanticBoost + scopeBoost);

        return {
          documentId: chunk.documentId,
          title: chunk.title,
          libraryType: chunk.libraryType,
          score,
          matchedChunk: `${chunk.articleRef}：${chunk.content}`,
          reason:
            keywordHits > 0
              ? '已先按公共库与当前项目组私有库范围过滤，再执行关键词与语义混合检索。'
              : '已在候选文本块中完成语义召回与重排，未直接扫描原始文件。',
          articleRef: chunk.articleRef,
          chapterTitle: chunk.chapterTitle,
          pageLabel: chunk.pageLabel,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const queryMode = tokens.length === 0 ? '语义优先' : '关键词 + 语义融合';
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
        prototypeMode: 'mock',
        answerTraceable: true,
      },
      answer:
        dto.groupId == null
          ? '系统已在公共基础库中优先检索已抽取、已切分、已建索引的文本块，并返回可追溯的制度依据。'
          : '系统已在公共基础库与当前项目组私有库中优先检索已抽取、已切分、已建索引的文本块，并返回可追溯的制度依据。',
      citations: candidates,
      explanation:
        '该查询链路采用 RAG 思路：先过滤范围，再对文本块进行混合检索与重排，最后将命中条款作为上下文供目标大模型生成解释。',
    };
  }
}

export { QueryRequestDto };
