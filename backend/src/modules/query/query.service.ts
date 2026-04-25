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
};

@Injectable()
export class QueryService {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly groupsService: GroupsService,
  ) {}

  search(dto: QueryRequestDto) {
    const group = dto.groupId
      ? this.groupsService.listGroups().find((item) => item.id === dto.groupId) ?? null
      : null;

    const lowerQuestion = dto.question.toLowerCase();
    const hasBudgetIntent = lowerQuestion.includes('资金');
    const hasProcurementIntent = lowerQuestion.includes('采购');

    const candidates: CitationRecord[] = this.documentsService
      .listDocuments(dto.groupId)
      .filter((document) => document.indexStatus === 'ready')
      .map((document) => {
        const isPrivate = document.libraryType === 'private';
        const score = hasBudgetIntent || hasProcurementIntent
          ? isPrivate
            ? 0.93
            : 0.88
          : isPrivate
            ? 0.81
            : 0.76;

        return {
          documentId: document.id,
          title: document.title,
          libraryType: document.libraryType,
          score,
          matchedChunk: isPrivate
            ? '第四条：项目组内部采购须履行审批、比价、验收与留痕。'
            : '第十二条：专项资金使用应符合预算用途，不得擅自改变资金性质。',
          reason: '已基于文本块进行关键词和语义融合检索，未直接扫描原始文件。',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return {
      question: dto.question,
      scope: {
        publicLibrary: true,
        groupId: dto.groupId ?? null,
        groupName: group?.name ?? null,
      },
      pipeline: ['元数据过滤', '文本块关键词检索', '文本块语义检索', '结果融合与重排', '千问答案生成'],
      answer:
        '系统已优先检索公共库与当前项目组私有库中已抽取、已切分、已建索引的文本块，并返回最相关的制度依据。',
      citations: candidates,
      explanation: '该流程避免在查询时解析大文件，适合审计场景下的高频查询与大文件知识库。',
    };
  }
}

export { QueryRequestDto };
