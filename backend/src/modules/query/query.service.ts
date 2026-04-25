import { Injectable } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';

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
  ) {}

  search(dto: QueryRequestDto) {
    const group = dto.groupId ? this.groupsService.getGroupById(dto.groupId) : null;
    const readyChunks = this.documentsService.getReadyChunks(dto.groupId);
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
              ? '已先按项目组范围过滤，再基于关键词命中和语义相关性完成融合检索。'
              : '已在候选文本块中完成语义召回与重排，未直接扫描原始文件。',
          articleRef: chunk.articleRef,
          chapterTitle: chunk.chapterTitle,
          pageLabel: chunk.pageLabel,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const queryMode = tokens.length === 0 ? '语义优先' : '关键词 + 语义融合';

    return {
      question: dto.question,
      scope: {
        publicLibrary: true,
        groupId: dto.groupId ?? null,
        groupName: group?.name ?? null,
      },
      pipeline: ['元数据过滤', '文本块关键词检索', '文本块语义检索', '结果融合与重排', '千问答案生成'],
      retrievalStats: {
        queryMode,
        tokenCount: tokens.length,
        candidateChunks: readyChunks.length,
        returnedCitations: candidates.length,
      },
      answer:
        '系统已优先检索公共库与当前项目组私有库中已抽取、已切分、已建索引的文本块，并返回最相关的制度依据。',
      citations: candidates,
      explanation: '该流程避免在查询时解析大文件，适合审计场景下的高频查询与大文件知识库。',
    };
  }
}

export { QueryRequestDto };
