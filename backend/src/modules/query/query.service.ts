import { ForbiddenException, Injectable } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { formatCst } from '../../utils/date';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { DocumentsService } from '../documents/documents.service';
import { EmbeddingService } from '../documents/embedding.service';
import { LibraryType, isPublicLibrary } from '../documents/library-type';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
import { QwenService } from './qwen.service';

class QueryRequestDto {
  @IsString()
  @MinLength(4)
  question!: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsIn(['regulation', 'material', 'case', 'risk'])
  queryScope?: 'regulation' | 'material' | 'case' | 'risk';
}

type CitationRecord = {
  documentId: string;
  title: string;
  libraryType: LibraryType;
  score: number;
  matchedChunk: string;
  reason: string;
  articleRef: string;
  chapterTitle: string;
  pageLabel: string;
};

type ReadyChunkRecord = Awaited<ReturnType<DocumentsService['getReadyChunks']>>[number];

type RiskLevel = '高' | '中' | '低';

type RiskCheckTableDetail = {
  explanation: string;
  legalBasisDetails: string[];
  caseDetails: string[];
  evidenceSuggestions: string[];
  possibleFindings: string[];
  rectificationSuggestions: string[];
};

type RiskCheckTableRow = {
  index: number;
  riskPoint: string;
  checkContent: string;
  legalBasis: string;
  caseReference: string;
  evidenceMaterials: string;
  riskLevel: RiskLevel;
  detail: RiskCheckTableDetail;
};

type RiskCheckTable = {
  topic: string;
  summary: string;
  columns: string[];
  rows: RiskCheckTableRow[];
};

@Injectable()
export class QueryService {
  constructor(
    private readonly authService: AuthService,
    private readonly documentsService: DocumentsService,
    private readonly embeddingService: EmbeddingService,
    private readonly groupsService: GroupsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly teamAgentsService: TeamAgentsService,
    private readonly qwenService: QwenService,
    private readonly auditService: AuditService,
  ) {}

  private buildCandidates({
    chunks,
    lowerQuestion,
    tokens,
    questionEmbedding,
    limit,
  }: {
    chunks: ReadyChunkRecord[];
    lowerQuestion: string;
    tokens: string[];
    questionEmbedding: number[] | null;
    limit: number;
  }): CitationRecord[] {
    return chunks
      .map((chunk) => {
        const keywordHits = chunk.keywords.filter((kw) => lowerQuestion.includes(kw.toLowerCase())).length;
        const contentHits = tokens.filter((t) => chunk.content.includes(t)).length;
        const scopeBoost = chunk.libraryType === 'private' ? 0.05 : 0.02;

        let score: number;
        if (questionEmbedding && chunk.embedding) {
          const cosine = this.embeddingService.cosineSimilarity(questionEmbedding, chunk.embedding);
          score = Math.min(0.99, (cosine + 1) / 2 + keywordHits * 0.03 + scopeBoost);
        } else {
          const articleTokens = tokens.filter((t) => /第.+条|第.+章/.test(t));
          const evidenceTokens = tokens.filter((t) =>
            ['合同', '发票', '验收', '付款', '凭证', '依据', '归档'].includes(t),
          );
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
          matchedChunk: chunk.chapterTitle + ' ' + chunk.articleRef + '：' + chunk.content,
          reason: hasVector
            ? '向量相似度 ' + ((score - scopeBoost) * 100).toFixed(1) + '%，命中 ' + matchedSignals + ' 个关键词。'
            : matchedSignals > 0
            ? '已命中 ' + matchedSignals + ' 个关键词/条款号，基于关键词混合召回。'
            : '当前文本块通过范围过滤进入候选集。',
          articleRef: chunk.articleRef,
          chapterTitle: chunk.chapterTitle,
          pageLabel: chunk.pageLabel,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private sanitizeJsonBlock(raw: string): string {
    return raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  private resolveRiskTemplates(question: string) {
    const lowerQuestion = question.toLowerCase();

    if (question.includes('采购') || question.includes('招标') || question.includes('供应商')) {
      return {
        riskPoints: ['采购程序不规范', '供应商遴选不透明', '验收控制流于形式', '采购价格异常'],
        checkContents: [
          '核查是否履行规定采购程序，是否存在拆分采购、规避招标或未按要求比价。',
          '核查供应商选择是否公允透明，是否存在固定供应商、关联交易或资质不符。',
          '核查验收是否真实完整，是否建立台账、是否双人验收、是否账实一致。',
          '核查采购价格是否明显偏离市场水平，是否建立询价、比价和价格复核机制。',
        ],
      };
    }

    if (question.includes('收入') || question.includes('销售') || question.includes('回款')) {
      return {
        riskPoints: ['收入确认不准确', '异常销售交易未被识别', '回款管理失控', '退货折让处理不规范'],
        checkContents: [
          '核查收入确认时点、金额和依据是否符合规定，是否存在提前或延后确认。',
          '核查年末集中交易、异常订单、关联销售等事项是否真实合理。',
          '核查回款记录、对账机制和账龄管理是否有效，是否存在截留或挪用回款。',
          '核查退货、折让、冲销等处理是否完整入账，是否影响收入真实性。',
        ],
      };
    }

    if (question.includes('存货') || question.includes('仓库') || question.includes('库存')) {
      return {
        riskPoints: ['存货账实不符', '跌价减值识别不充分', '出入库控制薄弱', '异常损耗未被及时发现'],
        checkContents: [
          '核查盘点结果、台账记录和财务账面是否一致，是否存在盘盈盘亏未处理。',
          '核查呆滞、毁损、积压存货是否及时识别并计提跌价或减值。',
          '核查出入库审批、复核和记录是否完整，是否存在无单出库或手续不全。',
          '核查损耗、报废、调拨等异常事项是否履行审批并留存依据。',
        ],
      };
    }

    if (question.includes('资金') || question.includes('现金') || question.includes('银行')) {
      return {
        riskPoints: ['资金收付审批失控', '银行账户管理不规范', '现金管理存在漏洞', '账实核对不及时'],
        checkContents: [
          '核查资金支付是否履行审批和授权程序，是否存在越权支付或挪用。',
          '核查银行账户开立、使用和清理是否规范，是否存在账外账户或账户混用。',
          '核查库存现金管理是否规范，是否存在坐支、白条抵库或私设小金库。',
          '核查银行对账、余额调节和未达账项清理是否及时完整。',
        ],
      };
    }

    if (question.includes('费用') || question.includes('报销') || lowerQuestion.includes('expense')) {
      return {
        riskPoints: ['费用报销不合规', '费用归属期间不准确', '审批和预算约束失效', '异常费用支出未被识别'],
        checkContents: [
          '核查报销票据、事由和标准是否真实合规，是否存在虚假报销。',
          '核查费用确认期间是否准确，是否存在跨期调节利润。',
          '核查费用审批、预算控制和超标准支出管理是否有效执行。',
          '核查大额、频繁或异常费用支出是否经过专项复核和解释。',
        ],
      };
    }

    return {
      riskPoints: ['关键业务程序执行不规范', '职责分离或授权审批不到位', '业务资料记录不完整', '异常交易或数据变动未被及时识别'],
      checkContents: [
        '核查关键业务流程是否按制度要求执行，是否存在规避程序或变相绕过控制的情形。',
        '核查岗位职责、审批权限和复核机制是否清晰，是否存在一人经办到底或越权处理。',
        '核查台账、单据、合同、验收和归档资料是否完整一致，是否存在缺失或前后不符。',
        '核查异常波动、敏感交易和关键数据是否经过有效识别、复核和解释。',
      ],
    };
  }

  private looksLikeRiskTitle(value: string, question: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (trimmed === question.trim()) return true;
    if (trimmed.length <= 3) return true;
    if (/制度|办法|规定|条例|准则|法|细则|规范|指引|通知|流程|手册|台账|资料|文件|案例$/.test(trimmed)) {
      return true;
    }
    if (/第.+条|第.+章/.test(trimmed)) {
      return true;
    }
    if (/风险排查|审计|检查表/.test(trimmed) && !/不|未|异常|失控|缺失|不足|不规范|不透明|不完整/.test(trimmed)) {
      return true;
    }
    return false;
  }

  private generateRiskExplanation(riskPoint: string): string {
    const explanations: Record<string, string> = {
      '采购程序不规范': '采购过程中未严格执行规定程序，可能导致采购不公、价格虚高、质量问题或利益输送。',
      '供应商遴选不透明': '供应商选择缺乏公开透明机制，可能存在关联交易、利益输送或资质不符等问题。',
      '验收控制流于形式': '验收环节缺乏有效控制，可能导致货物质量、数量与合同不符，或虚假验收。',
      '采购价格异常': '采购价格明显偏离市场水平，可能存在虚高定价、利益输送或缺乏比价机制。',
      '收入确认不准确': '收入确认时点、金额或依据不符合规定，可能导致财务报表失真或调节利润。',
      '异常销售交易未被识别': '年末集中交易、关联销售等异常事项未被有效识别和审查，可能影响收入真实性。',
      '回款管理失控': '回款记录、对账和账龄管理不到位，可能导致资金被截留、挪用或坏账风险。',
      '退货折让处理不规范': '退货、折让等处理不完整或不及时入账，可能影响收入和利润的真实性。',
      '存货账实不符': '存货盘点结果与账面记录不一致，可能存在盘盈盘亏、账实分离或资产流失。',
      '跌价减值识别不充分': '呆滞、毁损存货未及时识别和计提减值，可能导致资产虚增。',
      '出入库控制薄弱': '出入库审批、复核和记录不完整，可能导致存货流失或无单出库。',
      '异常损耗未被及时发现': '损耗、报废等异常事项未履行审批或缺乏依据，可能掩盖资产流失。',
      '资金收付审批失控': '资金支付缺乏有效审批和授权，可能导致资金被挪用、侵占或越权支付。',
      '银行账户管理不规范': '银行账户开立、使用和清理不规范，可能存在账外账户、私设小金库或账户混用。',
      '现金管理存在漏洞': '库存现金管理不规范，可能存在坐支、白条抵库或现金流失。',
      '账实核对不及时': '银行对账和余额调节不及时，可能掩盖资金异常或未达账项长期挂账。',
      '费用报销不合规': '报销票据、事由或标准不符合规定，可能存在虚假报销或违规支出。',
      '费用归属期间不准确': '费用确认期间不准确，可能存在跨期调节利润或费用资本化不当。',
      '审批和预算约束失效': '费用审批和预算控制机制失效，可能导致超标准支出或预算约束形同虚设。',
      '异常费用支出未被识别': '大额、频繁或异常费用支出未经专项复核，可能掩盖违规支出或利益输送。',
      '关键业务程序执行不规范': '关键业务流程未按制度执行，可能存在规避程序、变相绕过控制或执行不到位。',
      '职责分离或授权审批不到位': '岗位职责不清晰或审批权限失控，可能导致一人经办到底、越权处理或内控失效。',
      '业务资料记录不完整': '业务台账、原始凭证或审批资料不完整，可能影响业务可追溯性或掩盖违规行为。',
      '异常交易或数据变动未被及时识别': '异常交易、数据波动或例外事项未被及时识别和处理，可能掩盖舞弊或错误。',
    };
    return explanations[riskPoint] || `该风险点涉及${riskPoint}相关的内控缺失或执行不到位，可能导致错报、舞弊或违规行为。`;
  }

  private buildFallbackRiskTable(question: string, citations: CitationRecord[], similarCases: CitationRecord[]): RiskCheckTable {
    const templates = this.resolveRiskTemplates(question);

    const rows = citations.slice(0, 4).map((citation, index) => {
      const riskPoint = templates.riskPoints[index] ?? `重点风险环节${index + 1}`;
      return {
        index: index + 1,
        riskPoint,
        checkContent: templates.checkContents[index] ?? '结合制度条款、业务流程和原始资料检查高风险环节执行情况。',
        legalBasis: [citation.title, citation.chapterTitle, citation.articleRef].filter(Boolean).join(' · '),
        caseReference: similarCases[index]?.title ?? (similarCases.length > 0 ? similarCases[0].title : '可结合相关审计案例进一步核查'),
        evidenceMaterials: '制度文件、业务台账、审批记录、合同凭证、原始单据',
        riskLevel: (index < 2 ? '高' : index == 2 ? '中' : '低') as RiskLevel,
        detail: {
          explanation: this.generateRiskExplanation(riskPoint),
          legalBasisDetails: [citation.matchedChunk ? `【${citation.title}】${citation.matchedChunk}` : ''].filter(Boolean),
          caseDetails: similarCases[index] != null ? [`【${similarCases[index].title}】${similarCases[index].matchedChunk}`] : [],
          evidenceSuggestions: ['调取原始业务资料', '核对审批流程与执行记录', '比对台账、单据与实际执行情况'],
          possibleFindings: ['可能存在制度执行不到位', '可能存在内控缺失、程序不规范或异常事项未被识别'],
          rectificationSuggestions: ['完善制度执行流程', '补齐审批、验收和归档资料', '强化关键岗位复核与监督机制'],
        },
      };
    });

    return {
      topic: question,
      summary: rows.length === 0 ? '暂无足够依据生成风险排查表。' : `围绕“${question}”识别出 ${rows.length} 个重点风险点。`,
      columns: ['序号', '风险点', '检查内容', '法规依据', '案例参考', '取证资料', '风险等级'],
      rows,
    };
  }

  private async buildRiskTable(params: {
    question: string;
    citations: CitationRecord[];
    similarCases: CitationRecord[];
    userTier: 'free' | 'subscribed';
  }): Promise<RiskCheckTable | null> {
    const { question, citations, similarCases, userTier } = params;
    const riskCountGuidance = userTier === 'free'
      ? '输出 8-10 个基础风险点'
      : '输出尽可能全面的风险点（建议 10-20 个），覆盖高、中、低风险';
    const detailGuidance = userTier === 'free'
      ? '提供基础的风险说明'
      : '提供详细的风险解释，结合案例和法规进行深入分析';

    const prompt = `你是一名审计风险排查助手。请围绕用户输入生成风险排查表。\n\n用户输入：${question}\n\n法规和制度依据候选：\n${citations.map((c, i) => `${i + 1}.【${c.title}】${c.matchedChunk}`).join('\n\n')}\n\n案例候选：\n${similarCases.map((c, i) => `${i + 1}.【${c.title}】${c.matchedChunk}`).join('\n\n')}\n\n请严格输出 JSON，不要输出 markdown 代码块，不要输出额外解释。\nJSON 结构如下：\n{\n  “topic”: “string”,\n  “summary”: “string”,\n  “columns”: [“序号”, “风险点”, “检查内容”, “法规依据”, “案例参考”, “取证资料”, “风险等级”],\n  “rows”: [\n    {\n      “index”: 1,\n      “riskPoint”: “string”,\n      “checkContent”: “string”,\n      “legalBasis”: “string”,\n      “caseReference”: “string”,\n      “evidenceMaterials”: “string”,\n      “riskLevel”: “高|中|低”,\n      “detail”: {\n        “explanation”: “string”,\n        “legalBasisDetails”: [“string”],\n        “caseDetails”: [“string”],\n        “evidenceSuggestions”: [“string”],\n        “possibleFindings”: [“string”],\n        “rectificationSuggestions”: [“string”]\n      }\n    }\n  ]\n}\n\n字段定义要求：\n1. “风险点”必须表示最容易发生错报、漏报、舞弊、违规或控制失效的具体环节，必须写成问题型表达，如”采购程序不规范””审批授权失控””验收记录不完整”。\n2. “风险点”不能写成法规标题、制度名称、资料名称、文档标题，也不能直接照抄审计主题。\n3. “检查内容”是围绕风险点需要核查的具体事项或程序，不得与”风险点”重复。\n4. “法规依据”只能填写制度、法规、办法、条款等依据名称或摘要，不得写成风险点。\n5. “取证资料”只能填写审计取证时需要调取的资料。\n\n其他要求：\n1. ${riskCountGuidance}\n2. ${detailGuidance}\n3. 风险点要贴合审计主题\n4. 优先引用给定法规和案例\n5. 风险等级只能填写 高、中、低\n6. 每条都必须包含 detail。`;

    const text = await this.qwenService.generateFromPrompt(prompt);
    if (!text) {
      return citations.length > 0 ? this.buildFallbackRiskTable(question, citations, similarCases) : null;
    }

    try {
      const parsed = JSON.parse(this.sanitizeJsonBlock(text)) as RiskCheckTable;
      if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) {
        return citations.length > 0 ? this.buildFallbackRiskTable(question, citations, similarCases) : null;
      }
      const templates = this.resolveRiskTemplates(question);

      return {
        topic: parsed.topic || question,
        summary: parsed.summary || `围绕“${question}”生成的风险排查结果。`,
        columns: Array.isArray(parsed.columns) && parsed.columns.length > 0
            ? parsed.columns
            : ['序号', '风险点', '检查内容', '法规依据', '案例参考', '取证资料', '风险等级'],
        rows: parsed.rows.map((row, index) => {
          const fallbackRiskPoint = templates.riskPoints[index] ?? `重点风险环节${index + 1}`;
          const normalizedRiskPoint = this.looksLikeRiskTitle(row.riskPoint ?? '', question)
            ? fallbackRiskPoint
            : (row.riskPoint || fallbackRiskPoint);
          const normalizedCheckContent = row.checkContent && row.checkContent.trim().length > 0
            ? row.checkContent
            : (templates.checkContents[index] ?? '结合制度条款、业务流程和原始资料检查高风险环节执行情况。');

          const basisCitation = citations[index] ?? citations[0];
          const caseCitation = similarCases[index] ?? similarCases[0];
          const fallbackLegalBasisDetail = basisCitation?.matchedChunk ? `【${basisCitation.title}】${basisCitation.matchedChunk}` : '';
          const fallbackCaseDetail = caseCitation?.matchedChunk ? `【${caseCitation.title}】${caseCitation.matchedChunk}` : '';
          const normalizedLegalBasisDetails = Array.isArray(row.detail?.legalBasisDetails) && row.detail.legalBasisDetails.length > 0
            ? row.detail.legalBasisDetails.map((item) => item.includes('【') ? item : `【${basisCitation?.title ?? '法规依据'}】${item}`)
            : [fallbackLegalBasisDetail].filter(Boolean);
          const normalizedCaseDetails = Array.isArray(row.detail?.caseDetails) && row.detail.caseDetails.length > 0
            ? row.detail.caseDetails.map((item) => item.includes('【') ? item : `【${caseCitation?.title ?? '相关案例'}】${item}`)
            : [fallbackCaseDetail].filter(Boolean);

          return {
            index: Number(row.index) || index + 1,
            riskPoint: normalizedRiskPoint,
            checkContent: normalizedCheckContent,
            legalBasis: row.legalBasis || '',
            caseReference: row.caseReference || '',
            evidenceMaterials: row.evidenceMaterials || '',
            riskLevel: row.riskLevel === '高' || row.riskLevel === '中' || row.riskLevel === '低' ? row.riskLevel : '中',
            detail: {
              explanation: row.detail?.explanation || '',
              legalBasisDetails: normalizedLegalBasisDetails,
              caseDetails: normalizedCaseDetails,
              evidenceSuggestions: Array.isArray(row.detail?.evidenceSuggestions) ? row.detail.evidenceSuggestions : [],
              possibleFindings: Array.isArray(row.detail?.possibleFindings) ? row.detail.possibleFindings : [],
              rectificationSuggestions: Array.isArray(row.detail?.rectificationSuggestions) ? row.detail.rectificationSuggestions : [],
            },
          };
        }),
      };
    } catch {
      return citations.length > 0 ? this.buildFallbackRiskTable(question, citations, similarCases) : null;
    }
  }

  async search(dto: QueryRequestDto, options?: { skipAccounting?: boolean }) {
    if (this.authService.isAdmin() && (dto.groupId != null || dto.agentId != null)) {
      throw new ForbiddenException('\u7ba1\u7406\u5458\u4ec5\u53ef\u68c0\u7d22\u516c\u5171\u5e93\uff0c\u4e0d\u80fd\u6309\u9879\u76ee\u7ec4\u8303\u56f4\u68c0\u7d22');
    }

    const resolvedGroupId = await this.teamAgentsService.resolveGroupId(dto.agentId, dto.groupId);
    if (!this.authService.isAdmin() && resolvedGroupId != null) {
      await this.groupsService.assertCanAccessGroup(resolvedGroupId);
    }

    const usage = await this.subscriptionsService.getUsage();
    if (!options?.skipAccounting) {
      await this.subscriptionsService.assertCanRunQuery(usage.dailyQueries);
    }

    const plan = await this.subscriptionsService.getCurrentPlan();
    const canAccessCases = plan.limits.caseSearch;
    const userTier: 'free' | 'subscribed' = plan.id === 'free' ? 'free' : 'subscribed';

    const group = resolvedGroupId ? await this.groupsService.getGroupById(resolvedGroupId) : null;
    const teamAgent = resolvedGroupId ? await this.teamAgentsService.getVisibleAgentByGroupId(resolvedGroupId) : null;
    const readyChunks = await this.documentsService.getReadyChunks(resolvedGroupId);

    const baseRegulationTypes: LibraryType[] = ['regulation'];
    const localTypes: LibraryType[] = ['local_policy'];
    const caseTypes: LibraryType[] = canAccessCases ? ['national_case', 'local_case'] : [];
    const privateTypes: LibraryType[] = resolvedGroupId ? ['private'] : [];
    const industryTypes: LibraryType[] = ['industry'];

    const scopeLibraryTypes: Record<string, LibraryType[]> = {
      regulation: [...baseRegulationTypes, ...localTypes, ...privateTypes],
      material:   [...privateTypes, ...industryTypes, ...localTypes],
      case:       caseTypes,
      risk:       [...baseRegulationTypes, ...localTypes, ...privateTypes, ...industryTypes],
    };
    const allowedTypes = dto.queryScope ? scopeLibraryTypes[dto.queryScope] : scopeLibraryTypes.regulation;
    const filteredChunks = readyChunks.filter((c) => allowedTypes.includes(c.libraryType as LibraryType));
    const scopeSummary = await this.documentsService.getLibraryScopeSummary(resolvedGroupId);
    const lowerQuestion = dto.question.toLowerCase();
    const tokens = Array.from(
      new Set(
        lowerQuestion
          .split(/[\s\uff0c\u3002\u3001\u201c\u201d\u2018\u2019\uff1b\uff1a,.;!?\uff08\uff09()[\]\-]+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 2),
      ),
    );

    const questionEmbedding = await this.embeddingService.embed(dto.question);

    const candidates = this.buildCandidates({
      chunks: filteredChunks,
      lowerQuestion,
      tokens,
      questionEmbedding,
      limit: 6,
    });

    const shouldFetchSimilarCases = canAccessCases && (dto.queryScope == null || ['regulation', 'material', 'risk'].includes(dto.queryScope));
    const similarCaseChunks = shouldFetchSimilarCases
      ? readyChunks.filter((chunk) => ['national_case', 'local_case'].includes(chunk.libraryType))
      : [];
    const similarCaseCandidates = shouldFetchSimilarCases
      ? this.buildCandidates({
          chunks: similarCaseChunks,
          lowerQuestion,
          tokens,
          questionEmbedding,
          limit: 6,
        })
      : [];
    const similarCases = similarCaseCandidates
      .slice(0, 3);

    const queryMode = questionEmbedding
      ? '\u5411\u91cf\u68c0\u7d22 + \u5173\u952e\u8bcd\u878d\u5408'
      : tokens.length === 0
      ? '\u8303\u56f4\u4f18\u5148 + \u8bed\u4e49\u91cd\u6392'
      : '\u5173\u952e\u8bcd + \u8bed\u4e49\u878d\u5408';
    const publicHits = candidates.filter((c) => isPublicLibrary(c.libraryType)).length;
    const privateHits = candidates.filter((c) => c.libraryType === 'private').length;

    const fallbackAnswer =
      candidates.length === 0
        ? '未找到相关内容。建议：1) 尝试使用不同的关键词重新描述问题；2) 检查是否选择了正确的项目组或知识库范围；3) 确认相关文档是否已上传并完成索引。'
        : null;

    const qwenAnswer = fallbackAnswer == null
      ? await this.qwenService.generate(dto.question, candidates.map((c) => `【${c.title}】${c.matchedChunk}`))
      : null;

    const riskTable = dto.queryScope === 'risk'
      ? await this.buildRiskTable({
          question: dto.question,
          citations: candidates,
          similarCases,
          userTier,
        })
      : null;

    const answer = riskTable != null
      ? `${riskTable.topic}共识别出 ${riskTable.rows.length} 个重点风险点，建议优先关注高风险事项并结合取证资料逐项核查。`
      : fallbackAnswer ?? qwenAnswer ?? '\u68c0\u7d22\u5b8c\u6210\uff0c\u8bf7\u67e5\u770b\u4e0b\u65b9\u5f15\u7528\u6761\u6b3e\u3002';

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

    const result = {
      question: dto.question,
      agentMode: dto.agentId != null,
      agent:
        teamAgent == null
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
        isolationNotice:
          resolvedGroupId == null
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
        candidateChunks: filteredChunks.length,
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
      similarCases,
      riskTable,
      explanation:
        '\u8be5\u67e5\u8be2\u94fe\u8def\u5df2\u4ece\u56fa\u5b9a\u793a\u4f8b\u547d\u4e2d\u8fc7\u6e21\u5230\u57fa\u4e8e\u6301\u4e45\u5316 chunk \u7684\u68c0\u7d22\u9aa8\u67b6\uff1a\u5148\u8fc7\u6ee4\u8303\u56f4\uff0c\u518d\u5bf9\u6587\u672c\u5757\u6267\u884c\u5173\u952e\u8bcd\u4e0e\u8bed\u4e49\u7ebf\u7d22\u5339\u914d\uff0c\u6700\u540e\u8fd4\u56de\u53ef\u6eaf\u6e90\u7684\u5019\u9009\u6761\u6b3e\u3002',
    };

    if (!options?.skipAccounting) {
      this.subscriptionsService.recordQueryLog({
        id: 'query-log-' + Date.now(),
        userId: this.authService.me().id,
        teamId: resolvedGroupId ?? null,
        queryText: dto.question,
        queriedAt: formatCst(new Date()),
        consumedQuota: 1,
        queryResult: result,
        queryScope: dto.queryScope,
      });
    }

    return result;
  }
}

export { QueryRequestDto };
