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
        riskPoints: [
          '采购程序不规范', '供应商遴选不透明', '验收控制流于形式', '采购价格异常',
          '采购合同管理不规范', '采购审批授权失控', '采购需求论证不充分', '采购档案资料不完整',
          '采购分散或集中度异常', '采购质量控制薄弱', '采购预算执行不严格', '采购信息公开不充分',
          '采购变更和调整缺乏依据', '采购履约监督不到位', '采购纠纷处理不规范', '采购绩效评价缺失',
          '采购廉政风险防控不足', '采购电子化管理薄弱', '采购专业能力不足', '采购应急机制不健全'
        ],
        checkContents: [
          '核查是否履行规定采购程序，是否存在拆分采购、规避招标或未按要求比价。',
          '核查供应商选择是否公允透明，是否存在固定供应商、关联交易或资质不符。',
          '核查验收是否真实完整，是否建立台账、是否双人验收、是否账实一致。',
          '核查采购价格是否明显偏离市场水平，是否建立询价、比价和价格复核机制。',
          '核查采购合同签订、履行和变更是否规范，是否存在无合同采购或合同条款不完整。',
          '核查采购审批权限和授权程序是否清晰，是否存在越权采购或审批流于形式。',
          '核查采购需求是否经过充分论证和审批，是否存在盲目采购或需求不合理。',
          '核查采购档案是否完整归档，包括申请、审批、合同、验收等全流程资料。',
          '核查采购是否存在过度分散或过度集中，是否影响采购效率或形成垄断风险。',
          '核查采购物资质量标准和检验机制是否健全，是否存在质量问题或以次充好。',
          '核查采购预算编制和执行是否严格，是否存在超预算采购或预算调整不规范。',
          '核查采购信息是否按规定公开，包括采购公告、中标结果、合同信息等。',
          '核查采购变更、追加和调整是否有充分依据和审批，是否存在随意变更。',
          '核查采购履约过程监督是否到位，是否存在供应商违约或履约不力未被及时发现。',
          '核查采购纠纷和争议处理是否规范，是否建立投诉举报和处理机制。',
          '核查是否建立采购绩效评价机制，是否对采购效率、质量和成本进行评估。',
          '核查采购廉政风险防控措施是否健全，是否存在利益冲突或廉政风险。',
          '核查采购电子化和信息化管理是否到位，是否实现采购全流程线上管理。',
          '核查采购人员专业能力和培训是否充分，是否存在专业能力不足影响采购质量。',
          '核查是否建立采购应急机制，应对突发情况和紧急采购需求的能力是否充分。',
        ],
      };
    }

    if (question.includes('收入') || question.includes('销售') || question.includes('回款')) {
      return {
        riskPoints: [
          '收入确认不准确', '异常销售交易未被识别', '回款管理失控', '退货折让处理不规范',
          '销售合同管理不规范', '销售定价机制不合理', '销售折扣和优惠失控', '应收账款管理薄弱',
          '收入截止性测试异常', '关联方销售未披露', '销售佣金和返利核算不准确', '销售渠道管理混乱',
          '销售预测和计划不合理', '销售信用政策执行不严', '销售发票管理不规范', '销售业绩考核失真',
          '销售费用归集不准确', '销售数据分析不充分', '销售风险预警机制缺失', '销售合规性审查不到位'
        ],
        checkContents: [
          '核查收入确认时点、金额和依据是否符合规定，是否存在提前或延后确认。',
          '核查年末集中交易、异常订单、关联销售等事项是否真实合理。',
          '核查回款记录、对账机制和账龄管理是否有效，是否存在截留或挪用回款。',
          '核查退货、折让、冲销等处理是否完整入账，是否影响收入真实性。',
          '核查销售合同签订、履行和归档是否规范，是否存在无合同销售或合同条款不完整。',
          '核查销售定价是否合理，是否存在异常低价、关联交易定价不公允或价格审批缺失。',
          '核查销售折扣、返利和优惠政策是否经过审批，是否存在超标准折扣或私自让利。',
          '核查应收账款催收、坏账核销和账龄分析是否及时，是否存在长期挂账或虚增资产。',
          '核查资产负债表日前后的销售和退货是否记录在正确期间，是否存在跨期调节收入。',
          '核查关联方销售是否真实、定价是否公允、是否完整披露，是否存在利益输送。',
          '核查销售佣金、返利和激励的计提和支付是否准确，是否存在虚列或漏列。',
          '核查销售渠道的开发、管理和评估是否规范，是否存在渠道冲突或管理混乱。',
          '核查销售预测和计划编制是否科学合理，是否与实际执行存在重大偏差。',
          '核查销售信用政策执行是否严格，是否存在超信用额度销售或信用审批流于形式。',
          '核查销售发票开具、传递和管理是否规范，是否存在虚开、代开或发票管理混乱。',
          '核查销售业绩考核指标和方法是否合理，是否存在虚报业绩或考核失真。',
          '核查销售费用的归集、分摊和核算是否准确，是否存在费用混淆或归集不当。',
          '核查是否建立销售数据分析机制，对销售趋势、客户结构和产品结构进行分析。',
          '核查是否建立销售风险预警机制，及时识别和应对销售异常和风险信号。',
          '核查销售活动合规性审查是否到位，是否存在商业贿赂、不正当竞争等违规行为。',
        ],
      };
    }

    if (question.includes('存货') || question.includes('仓库') || question.includes('库存')) {
      return {
        riskPoints: [
          '存货账实不符', '跌价减值识别不充分', '出入库控制薄弱', '异常损耗未被及时发现',
          '存货盘点制度不健全', '存货计价方法不一致', '存货保管条件不达标', '存货周转率异常',
          '委托代销存货管理混乱', '存货抵押或质押未披露', '存货分类核算不准确', '存货成本归集不合理',
          '存货领用审批不严格', '存货报废处置不规范', '存货安全库存管理缺失', '存货信息系统数据不准',
          '存货保险覆盖不充分', '存货所有权归属不清', '存货税务处理不合规', '存货预算和计划脱节'
        ],
        checkContents: [
          '核查盘点结果、台账记录和财务账面是否一致，是否存在盘盈盘亏未处理。',
          '核查呆滞、毁损、积压存货是否及时识别并计提跌价或减值。',
          '核查出入库审批、复核和记录是否完整，是否存在无单出库或手续不全。',
          '核查损耗、报废、调拨等异常事项是否履行审批并留存依据。',
          '核查是否建立定期盘点制度，盘点计划、实施和差异处理是否规范。',
          '核查存货计价方法是否前后一致，是否存在随意变更计价方法调节利润。',
          '核查存货保管环境、安全措施和防护条件是否达标，是否存在毁损或灭失风险。',
          '核查存货周转率是否异常，是否存在积压、呆滞或虚增存货。',
          '核查委托代销、受托代销存货是否单独核算，是否存在账实不符或混淆。',
          '核查存货是否存在抵押、质押或其他权利限制，是否完整披露。',
          '核查存货分类是否准确，原材料、在产品、产成品等是否正确区分和核算。',
          '核查存货成本归集是否合理，直接材料、直接人工和制造费用分配是否准确。',
          '核查存货领用是否经过审批，领用记录和用途是否清晰，是否存在私自领用。',
          '核查存货报废、毁损处置是否履行审批程序，处置收入和损失核算是否准确。',
          '核查是否建立安全库存管理机制，最高最低库存预警和补货机制是否有效。',
          '核查存货信息系统数据是否准确完整，系统数据与实物和账面是否一致。',
          '核查存货保险覆盖范围和保额是否充分，是否存在保险缺口或保险不足。',
          '核查存货所有权归属是否清晰，是否存在代管、寄存或所有权不明的存货。',
          '核查存货增值税、消费税等税务处理是否合规，进项税抵扣和销项税计提是否准确。',
          '核查存货采购、生产和销售计划是否衔接，是否存在预算和实际执行严重脱节。',
        ],
      };
    }

    if (question.includes('资金') || question.includes('现金') || question.includes('银行')) {
      return {
        riskPoints: [
          '资金收付审批失控', '银行账户管理不规范', '现金管理存在漏洞', '账实核对不及时',
          '资金使用效率低下', '大额资金支付缺乏监督', '票据管理不规范', '资金归集和调度失控',
          '利息收支核算不准确', '资金安全保障措施不足', '资金预算执行不严格', '资金往来核算不清晰',
          '资金支付方式不合规', '资金监控和预警缺失', '资金结算效率低下', '外汇资金管理混乱',
          '资金投资决策不审慎', '资金风险对冲不充分', '资金信息披露不完整', '资金内控测试不到位'
        ],
        checkContents: [
          '核查资金支付是否履行审批和授权程序，是否存在越权支付或挪用。',
          '核查银行账户开立、使用和清理是否规范，是否存在账外账户或账户混用。',
          '核查库存现金管理是否规范，是否存在坐支、白条抵库或私设小金库。',
          '核查银行对账、余额调节和未达账项清理是否及时完整。',
          '核查资金使用计划和效率分析是否到位，是否存在资金闲置或使用效率低下。',
          '核查大额资金支付是否经过专项审批和复核，是否存在异常支付或资金流失。',
          '核查票据的购买、保管、使用和核销是否规范，是否存在票据遗失或违规使用。',
          '核查资金归集、调度和统筹管理是否有效，是否存在资金分散或调度失控。',
          '核查银行存款利息收入和借款利息支出核算是否准确完整，是否存在漏记或错记。',
          '核查资金安全措施是否健全，包括印鉴分管、密码保护、网银管理等。',
          '核查资金预算编制和执行是否严格，是否存在超预算支付或预算调整不规范。',
          '核查资金往来核算是否清晰，往来款项性质、期限和清理是否明确。',
          '核查资金支付方式是否合规，是否存在现金支付超限额或支付方式不当。',
          '核查是否建立资金监控和预警机制，对资金异常波动和风险及时识别和应对。',
          '核查资金结算效率是否合理，是否存在结算延迟或结算成本过高。',
          '核查外汇资金收支、结汇购汇和汇率风险管理是否规范，是否存在外汇违规。',
          '核查资金投资决策程序是否审慎，投资风险评估和收益分析是否充分。',
          '核查是否建立资金风险对冲机制，利率风险、汇率风险等是否有效管理。',
          '核查资金信息披露是否完整准确，重大资金事项是否及时披露。',
          '核查资金内控制度执行情况测试是否到位，内控有效性是否得到验证。',
        ],
      };
    }

    if (question.includes('费用') || question.includes('报销') || lowerQuestion.includes('expense')) {
      return {
        riskPoints: [
          '费用报销不合规', '费用归属期间不准确', '审批和预算约束失效', '异常费用支出未被识别',
          '费用票据真实性存疑', '费用标准执行不严格', '差旅费报销管理混乱', '业务招待费超标',
          '费用分摊和归集不合理', '费用资本化处理不当', '费用支付方式不规范', '费用核算科目混乱',
          '费用审批流程不完整', '费用报销时效性差', '费用税务处理不合规', '费用绩效评价缺失',
          '费用电子化管理薄弱', '费用内控测试不充分', '费用信息披露不完整', '费用舞弊风险防控不足'
        ],
        checkContents: [
          '核查报销票据、事由和标准是否真实合规，是否存在虚假报销。',
          '核查费用确认期间是否准确，是否存在跨期调节利润。',
          '核查费用审批、预算控制和超标准支出管理是否有效执行。',
          '核查大额、频繁或异常费用支出是否经过专项复核和解释。',
          '核查费用票据来源、内容和真实性，是否存在假票、重复报销或票实不符。',
          '核查费用报销标准是否严格执行，是否存在超标准报销或违规列支。',
          '核查差旅费报销是否符合规定，包括出差审批、行程记录、住宿和交通标准等。',
          '核查业务招待费是否超过预算或比例限制，是否存在私人消费公款报销。',
          '核查共同费用分摊方法是否合理一致，费用归集是否准确完整。',
          '核查应予资本化的支出是否错误计入费用，或应予费用化的支出是否错误资本化。',
          '核查费用支付方式是否规范，是否存在现金支付超限额或支付凭证不全。',
          '核查费用核算科目使用是否准确，是否存在科目混淆或费用性质不清。',
          '核查费用审批流程是否完整，审批权限、审批依据和审批记录是否清晰。',
          '核查费用报销时效性是否合理，是否存在长期挂账或报销延迟影响核算准确性。',
          '核查费用税务处理是否合规，进项税抵扣、个人所得税代扣代缴是否准确。',
          '核查是否建立费用绩效评价机制，对费用效益和合理性进行评估。',
          '核查费用电子化管理是否到位，费用申请、审批和报销是否实现线上管理。',
          '核查费用内控制度执行情况测试是否充分，内控有效性是否得到验证。',
          '核查费用信息披露是否完整准确，重大费用事项是否及时披露。',
          '核查费用舞弊风险防控措施是否健全，是否存在虚报冒领或利益输送风险。',
        ],
      };
    }

    return {
      riskPoints: [
        '关键业务程序执行不规范', '职责分离或授权审批不到位', '业务资料记录不完整', '异常交易或数据变动未被及时识别',
        '内控制度建设不健全', '风险评估和监控缺失', '信息系统控制薄弱', '关联交易管理不规范',
        '重大事项决策程序不合规', '档案管理和信息披露不完整', '合规性审查不到位', '业务连续性保障不足',
        '第三方管理和监督缺失', '利益冲突识别和防范不充分', '业务创新风险管控不足', '跨部门协同机制不健全',
        '业绩考核和激励机制失衡', '员工培训和能力建设不足', '外部审计和监管应对不力', '持续改进机制缺失'
      ],
      checkContents: [
        '核查关键业务流程是否按制度要求执行，是否存在规避程序或变相绕过控制的情形。',
        '核查岗位职责、审批权限和复核机制是否清晰，是否存在一人经办到底或越权处理。',
        '核查台账、单据、合同、验收和归档资料是否完整一致，是否存在缺失或前后不符。',
        '核查异常波动、敏感交易和关键数据是否经过有效识别、复核和解释。',
        '核查内控制度是否健全完善，是否覆盖关键业务环节和风险点。',
        '核查是否建立风险评估机制，是否定期识别、评估和应对重大风险。',
        '核查信息系统访问控制、数据备份和安全防护措施是否到位。',
        '核查关联方识别、关联交易审批和信息披露是否完整规范。',
        '核查重大投资、资产处置、对外担保等事项是否履行决策程序和审批手续。',
        '核查业务档案、财务资料和重要信息是否完整归档和及时披露。',
        '核查业务活动合规性审查是否到位，是否存在违反法律法规或监管要求的情形。',
        '核查业务连续性计划和应急预案是否健全，应对突发事件的能力是否充分。',
        '核查第三方合作伙伴的选择、管理和监督是否规范，是否存在第三方风险。',
        '核查利益冲突识别和防范机制是否健全，是否存在利益冲突影响公正性。',
        '核查业务创新和新业务开展的风险评估和管控是否充分，是否存在盲目创新。',
        '核查跨部门协同机制是否健全，部门间信息共享和业务衔接是否顺畅。',
        '核查业绩考核和激励机制是否合理平衡，是否存在过度激励或考核失衡。',
        '核查员工培训和能力建设是否充分，员工专业能力是否满足业务需要。',
        '核查外部审计和监管检查发现问题的整改是否到位，应对措施是否有效。',
        '核查是否建立持续改进机制，对内控缺陷和管理问题是否及时改进和优化。',
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

  private async assessRiskLevels(question: string, riskItems: Array<{ riskPoint: string; checkContent: string; legalBasis: string }>): Promise<RiskLevel[]> {
    const prompt = `你是审计风险评估专家。请根据审计主题和风险点信息，评估每个风险点的风险等级。

审计主题：${question}

风险点列表：
${riskItems.map((item, i) => `${i + 1}. ${item.riskPoint}\n   检查内容：${item.checkContent}\n   法规依据：${item.legalBasis}`).join('\n\n')}

评估标准：
- 高风险：涉及资金安全、重大违规、舞弊可能性大、影响财务报表真实性的关键环节
- 中风险：涉及内控缺失、程序不规范、可能导致错报或违规的重要环节
- 低风险：一般性管理问题、影响相对较小的常规检查事项

请严格输出JSON数组，不要输出markdown代码块，不要输出额外解释。
格式：["高", "中", "低", ...]

数组长度必须等于风险点数量（${riskItems.length}个），每个元素只能是"高"、"中"或"低"。`;

    try {
      const text = await this.qwenService.generateFromPrompt(prompt);
      if (!text) throw new Error('LLM返回空结果');

      const parsed = JSON.parse(this.sanitizeJsonBlock(text)) as string[];
      if (!Array.isArray(parsed) || parsed.length !== riskItems.length) {
        throw new Error('LLM返回格式不正确');
      }

      return parsed.map(level => {
        if (level === '高' || level === '中' || level === '低') return level as RiskLevel;
        return '中' as RiskLevel;
      });
    } catch {
      return riskItems.map((item, index) => {
        const riskPoint = item.riskPoint.toLowerCase();
        const highKeywords = ['资金', '审批失控', '挪用', '侵占', '舞弊', '虚假', '账实不符', '私设', '小金库', '越权'];
        const lowKeywords = ['记录', '资料', '台账', '归档', '不完整', '不及时'];

        if (highKeywords.some(kw => riskPoint.includes(kw))) return '高';
        if (lowKeywords.some(kw => riskPoint.includes(kw))) return '低';
        return index < 3 ? '高' : index < 6 ? '中' : '低';
      }) as RiskLevel[];
    }
  }

  private async buildFallbackRiskTable(question: string, citations: CitationRecord[], similarCases: CitationRecord[], userTier: 'free' | 'subscribed'): Promise<RiskCheckTable> {
    const templates = this.resolveRiskTemplates(question);
    const maxRisks = userTier === 'free' ? 10 : 20;
    const availableCitations = citations.slice(0, Math.min(citations.length, maxRisks));

    const riskItems = availableCitations.map((citation, index) => {
      const riskPoint = templates.riskPoints[index] ?? `重点风险环节${index + 1}`;
      return {
        riskPoint,
        checkContent: templates.checkContents[index] ?? '结合制度条款、业务流程和原始资料检查高风险环节执行情况。',
        legalBasis: [citation.title, citation.chapterTitle, citation.articleRef].filter(Boolean).join(' · '),
        citation,
      };
    });

    const riskLevels = await this.assessRiskLevels(question, riskItems);

    const rows = availableCitations.map((citation, index) => {
      const riskPoint = templates.riskPoints[index] ?? `重点风险环节${index + 1}`;
      return {
        index: index + 1,
        riskPoint,
        checkContent: templates.checkContents[index] ?? '结合制度条款、业务流程和原始资料检查高风险环节执行情况。',
        legalBasis: [citation.title, citation.chapterTitle, citation.articleRef].filter(Boolean).join(' · '),
        caseReference: similarCases[index]?.title ?? (similarCases.length > 0 ? similarCases[0].title : '可结合相关审计案例进一步核查'),
        evidenceMaterials: '制度文件、业务台账、审批记录、合同凭证、原始单据',
        riskLevel: riskLevels[index] || '中',
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
      summary: rows.length === 0 ? '暂无足够依据生成风险排查表。' : `围绕”${question}”识别出 ${rows.length} 个重点风险点。`,
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
      return citations.length > 0 ? this.buildFallbackRiskTable(question, citations, similarCases, userTier) : null;
    }

    try {
      const parsed = JSON.parse(this.sanitizeJsonBlock(text)) as RiskCheckTable;
      if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) {
        return citations.length > 0 ? this.buildFallbackRiskTable(question, citations, similarCases, userTier) : null;
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
              explanation: row.detail?.explanation && row.detail.explanation.trim().length > 0
                ? row.detail.explanation
                : this.generateRiskExplanation(normalizedRiskPoint),
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
      return citations.length > 0 ? this.buildFallbackRiskTable(question, citations, similarCases, userTier) : null;
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

    const candidateLimit = dto.queryScope === 'risk' ? 100 : 6;
    const candidates = this.buildCandidates({
      chunks: filteredChunks,
      lowerQuestion,
      tokens,
      questionEmbedding,
      limit: candidateLimit,
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
