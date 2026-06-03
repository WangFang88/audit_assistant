import { Injectable, Logger } from '@nestjs/common';
import { XlsxSheetData } from './text-extraction.service';
import { LibraryType } from './library-type';

interface DocumentRecord {
  id: string;
  title: string;
  libraryType: LibraryType;
  region: string | null;
  sourcePath: string;
  fileName: string;
  uploadedBy: string;
  chunkCount: number;
  indexStatus: string;
  extractionMode: string;
  uploadedAt: string;
  groupId: string | null;
  fileType: string;
}

interface DocumentChunkRecord {
  id: string;
  documentId: string;
  groupId: string | null;
  libraryType: LibraryType;
  region: string | null;
  title: string;
  chapterTitle: string;
  articleRef: string;
  pageLabel: string;
  content: string;
  keywords: string[];
  indexStatus: 'ready';
}

interface ColumnTypes {
  mainContentCols: string[];
  articleRefCols: string[];
  orgNameCols: string[];
  categoryCols: string[];
  metadataCols: string[];
}

const STOP_WORDS = new Set([
  '的', '了', '在', '是', '有', '和', '与', '及', '或', '不', '也', '就', '都', '而',
  '对', '从', '到', '被', '把', '让', '向', '以', '能', '会', '要', '将', '着', '过',
  '但', '所', '其', '这', '那', '该', '此', '并', '且', '之', '为', '等', '于', '可',
  '不符合', '根据', '按照', '对于', '关于', '相关', '一个', '一种', '这个', '那个',
  '已经', '没有', '可以', '需要', '进行', '通过', '其中', '以及', '是否', '什么',
  '怎么', '怎样', '为什么', '如果', '虽然', '但是', '因为', '所以', '因此', '然后',
  '我们', '他们', '你们', '自己', '它', '他', '她', '上', '下', '中', '里', '外',
  '来', '去', '做', '说', '看', '见', '出', '用', '好', '很', '较', '多', '少',
  '无', '应', '已', '前', '后', '内', '时', '均由', '存在', '应于', '均由',
]);

@Injectable()
export class CaseChunkProcessorService {
  private readonly logger = new Logger(CaseChunkProcessorService.name);

  private readonly COLUMN_PATTERNS = {
    mainContent: /问题事实描述|问题概述|问题描述|违规事实|主要问题|审计发现问题|审计发现|事实描述|问题事实|问题$/,
    articleRef: /定性依据|违反条例|法规依据|法律法规|定性法规|问题依据|依据|违反.*规定|^依据$/,
    orgName: /组织名称|被审计单位|单位名称|^单位$|审计单位|机构名称|^组织$/,
    category: /问题类别|问题类型|问题分类|审计类别|^类别$/,
    metadata: /^证据$|充分性|佐证|备注|下户人员|审计人员|审计组|处理意见|处理.*情况|问题金额|涉及金额|^金额$|^序号$|^编号$/,
  };

  private buildImportedChunkId(documentId: string, index: number) {
    return `chunk-${documentId}-${index + 1}`;
  }

  // ============================================================
  // XLSX 案例切分
  // ============================================================

  buildXlsxCaseChunks(document: DocumentRecord, sheets: XlsxSheetData[]): DocumentChunkRecord[] {
    const chunks: DocumentChunkRecord[] = [];
    let globalIndex = 0;

    for (const sheet of sheets) {
      if (sheet.rows.length === 0) continue;

      // 跳过审计工作底稿类的非数据表（表头包含审计元数据字段而非数据列名）
      if (this.isAuditWorkingPaper(sheet.headers)) continue;

      const columnTypes = this.detectColumnTypes(sheet.headers);

      for (let rowIdx = 0; rowIdx < sheet.rows.length; rowIdx++) {
        const row = sheet.rows[rowIdx];
        const content = this.assembleContent(row, sheet.headers, columnTypes);
        const articleRef = this.extractArticleRef(row, columnTypes);
        const orgName = this.extractOrgName(row, columnTypes);

        if (content.trim().length < 10) continue;

        // 大小限制：超过 1200 字符按句子边界拆分
        const segments = this.splitLongContent(content, 1200);

        for (const segment of segments) {
          const pageLabel = segments.length > 1
            ? `${sheet.sheetName} 第${rowIdx + 1}行(${segments.indexOf(segment) + 1}/${segments.length})`
            : `${sheet.sheetName} 第${rowIdx + 1}行`;

          const titleKeywords = this.extractTitleKeywords(document.title);
          const contentKeywords = this.extractContentKeywords(segment, titleKeywords);

          chunks.push({
            id: this.buildImportedChunkId(document.id, globalIndex),
            documentId: document.id,
            groupId: document.groupId,
            libraryType: document.libraryType,
            region: document.region,
            title: document.title,
            chapterTitle: `${sheet.sheetName}${orgName ? ` - ${orgName}` : ''}`,
            articleRef,
            pageLabel,
            content: segment,
            keywords: [...titleKeywords, ...contentKeywords],
            indexStatus: 'ready',
          });

          globalIndex++;
        }
      }
    }

    return chunks;
  }

  /**
   * 判断 sheet 是否为审计工作底稿（非数据表），基于表头关键词检测
   */
  private isAuditWorkingPaper(headers: string[]): boolean {
    if (headers.length === 0) return true;

    // 审计工作底稿元数据字段
    const metadataPattern = /被审计单位|审计项目|审计人员|复核人员|会计期间|会计截止日|编号|日期|第.*页|共.*页/;
    // 数据表列名（含"序号"说明是正常数据表，不过滤）
    const dataPattern = /序号|问题|描述|违反|条例|法规|依据|名称|金额|类别/;

    let metadataCount = 0;
    let dataCount = 0;

    for (const h of headers) {
      // 去除空格后匹配（处理"被 审 计 单 位"等分散字符的情况）
      const normalized = h.replace(/\s+/g, '');
      if (metadataPattern.test(normalized)) metadataCount++;
      if (dataPattern.test(normalized)) dataCount++;
    }

    // 如果元数据字段 >= 2 且数据字段 < 2，判定为工作底稿
    return metadataCount >= 2 && dataCount < 2;
  }

  /**
   * 检测每列的语义类型
   */
  private detectColumnTypes(headers: string[]): ColumnTypes {
    const result: ColumnTypes = {
      mainContentCols: [],
      articleRefCols: [],
      orgNameCols: [],
      categoryCols: [],
      metadataCols: [],
    };

    for (const h of headers) {
      const trimmed = h.trim();
      if (this.COLUMN_PATTERNS.articleRef.test(trimmed)) {
        result.articleRefCols.push(trimmed);
      } else if (this.COLUMN_PATTERNS.orgName.test(trimmed)) {
        result.orgNameCols.push(trimmed);
      } else if (this.COLUMN_PATTERNS.category.test(trimmed)) {
        result.categoryCols.push(trimmed);
      } else if (this.COLUMN_PATTERNS.metadata.test(trimmed)) {
        result.metadataCols.push(trimmed);
      } else if (this.COLUMN_PATTERNS.mainContent.test(trimmed)) {
        result.mainContentCols.push(trimmed);
      } else {
        // 未识别的列：如果内容较长则作为主内容，否则作为元数据
        result.mainContentCols.push(trimmed);
      }
    }

    return result;
  }

  /**
   * 结构化拼接行内容
   */
  private assembleContent(row: Record<string, string>, headers: string[], columnTypes: ColumnTypes): string {
    const parts: string[] = [];

    // 组织名称前缀
    for (const col of columnTypes.orgNameCols) {
      const val = row[col]?.trim();
      if (val) parts.push(`[组织名称: ${val}]`);
    }

    // 问题类别前缀
    for (const col of columnTypes.categoryCols) {
      const val = row[col]?.trim();
      if (val) parts.push(`[问题类别: ${val}]`);
    }

    // 主内容（不标注前缀）
    for (const col of columnTypes.mainContentCols) {
      const val = row[col]?.trim();
      if (val) parts.push(val);
    }

    // 元数据列标注前缀
    for (const col of columnTypes.metadataCols) {
      const val = row[col]?.trim();
      if (val) parts.push(`[${col}: ${val}]`);
    }

    // 未被分类的列
    const classified = new Set([
      ...columnTypes.orgNameCols,
      ...columnTypes.categoryCols,
      ...columnTypes.mainContentCols,
      ...columnTypes.metadataCols,
      ...columnTypes.articleRefCols,
    ]);
    for (const h of headers) {
      if (!classified.has(h)) {
        const val = row[h]?.trim();
        if (val) parts.push(`[${h}: ${val}]`);
      }
    }

    return parts.join('\n');
  }

  private extractArticleRef(row: Record<string, string>, columnTypes: ColumnTypes): string {
    for (const col of columnTypes.articleRefCols) {
      const val = row[col]?.trim();
      if (val) {
        // 截断至 128 字符以匹配数据库 varchar(128) 列
        return val.length <= 128 ? val : val.slice(0, 125) + '...';
      }
    }
    return '';
  }

  private extractOrgName(row: Record<string, string>, columnTypes: ColumnTypes): string {
    for (const col of columnTypes.orgNameCols) {
      const val = row[col]?.trim();
      if (val) return val;
    }
    return '';
  }

  // ============================================================
  // 文本案例切分
  // ============================================================

  buildTextCaseChunks(document: DocumentRecord, rawText: string): DocumentChunkRecord[] {
    const normalizedText = rawText.replace(/\r/g, '').trim();

    // 使用 lookahead 切分，保留案例标记在内容中
    const casePattern = /(?=案例[一二三四五六七八九十\d]+[、：:.])/;
    const rawSegments = normalizedText.split(casePattern).filter(s => s.trim().length > 10);

    // 误匹配防护：合并过短的碎片
    const mergedSegments = this.mergeShortSegments(rawSegments);

    if (mergedSegments.length === 0) {
      // fallback：按双换行分段，每 4 段合并
      const paragraphs = normalizedText.split(/\n\n+/).filter(p => p.trim().length > 10);
      if (paragraphs.length === 0) return [];

      const grouped: string[] = [];
      for (let i = 0; i < paragraphs.length; i += 4) {
        grouped.push(paragraphs.slice(i, i + 4).join('\n\n'));
      }
      return this.buildChunksFromSegments(document, grouped);
    }

    // 大小限制：超过 1200 字符按句子边界拆分
    const finalSegments: string[] = [];
    for (const seg of mergedSegments) {
      finalSegments.push(...this.splitLongContent(seg, 1200));
    }

    return this.buildChunksFromSegments(document, finalSegments);
  }

  /**
   * 合并被误判为案例标记的短碎片（如证据列表编号）
   */
  private mergeShortSegments(segments: string[]): string[] {
    if (segments.length <= 1) return segments;

    const auditKeywords = /问题|条款|依据|定性|违规|处理|审计|规定|违反|法规|整改/;
    const result: string[] = [segments[0]];

    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.length < 100 && !auditKeywords.test(seg)) {
        // 短片段且不含审计关键词 → 合并回前一段
        result[result.length - 1] += seg;
      } else {
        result.push(seg);
      }
    }

    return result;
  }

  private buildChunksFromSegments(document: DocumentRecord, segments: string[]): DocumentChunkRecord[] {
    const titleKeywords = this.extractTitleKeywords(document.title);

    // 尝试从片段中提取章节标题（如"问题一"、"案例 X"等）
    const chapterPattern = /^(案例[一二三四五六七八九十\d]+[、：:.]?\s*|【[^】]+】|问题[一二三四五六七八九十\d]+[:：]?\s*)/;

    return segments.map((segment, index) => {
      const content = segment.trim();
      const chapterMatch = content.match(chapterPattern);
      const chapterTitle = chapterMatch ? chapterMatch[1].replace(/[、：:.\s]+$/, '') : `案例${index + 1}`;
      const contentKeywords = this.extractContentKeywords(content, titleKeywords);

      return {
        id: this.buildImportedChunkId(document.id, index),
        documentId: document.id,
        groupId: document.groupId,
        libraryType: document.libraryType,
        region: document.region,
        title: document.title,
        chapterTitle,
        articleRef: '',
        pageLabel: `案例${index + 1}`,
        content,
        keywords: [...titleKeywords, ...contentKeywords],
        indexStatus: 'ready',
      };
    });
  }

  // ============================================================
  // 关键词提取
  // ============================================================

  private extractTitleKeywords(title: string): string[] {
    return title
      .replace(/[()\uff08\uff09_.\/-]+/g, ' ')
      .split(/[\s]+/)
      .filter(item => item.length >= 2);
  }

  private extractContentKeywords(text: string, titleKeywords: string[]): string[] {
    const titleSet = new Set(titleKeywords);

    // 去标点、分词，同时移除 label 前缀标记中的冒号
    const words = text
      .replace(/[\uff0c\u3002\uff1b\uff1a\u3001\u201c\u201d\u2018\u2019\uff08\uff09()\u3010\u3011\[\]\-【】\n\r]/g, ' ')
      .split(/[\s]+/)
      .filter(item => item.length >= 2 && !item.endsWith('：') && !item.endsWith(':'));

    // 过滤停用词和标题关键词
    const filtered = words.filter(w => !STOP_WORDS.has(w) && !titleSet.has(w));

    // 按频率排序取前 15 个
    const freq = new Map<string, number>();
    for (const w of filtered) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
    const sorted = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([w]) => w);

    // 如果有效词不足 10 个，用 2-gram/3-gram 补充
    if (sorted.length < 10) {
      const ngrams = this.extractNgrams(text, titleSet, 10 - sorted.length);
      for (const ng of ngrams) {
        if (!sorted.includes(ng)) {
          sorted.push(ng);
        }
      }
    }

    return sorted.slice(0, 15);
  }

  /**
   * 从文本中提取 n-gram（2-gram 和 3-gram）作为候选关键词
   */
  private extractNgrams(text: string, titleSet: Set<string>, count: number): string[] {
    const cleaned = text
      .replace(/[\uff0c\u3002\uff1b\uff1a\u3001\u201c\u201d\u2018\u2019\uff08\uff09()\u3010\u3011\[\]\-【】\n\r]/g, '')
      .replace(/\s+/g, '');

    const result: string[] = [];

    // 2-gram
    for (let i = 0; i < cleaned.length - 1; i++) {
      const bigram = cleaned.substring(i, i + 2);
      if (!STOP_WORDS.has(bigram) && !titleSet.has(bigram) && /[\u4e00-\u9fa5]{2}/.test(bigram)) {
        result.push(bigram);
      }
    }

    // 3-gram
    for (let i = 0; i < cleaned.length - 2; i++) {
      const trigram = cleaned.substring(i, i + 3);
      if (!STOP_WORDS.has(trigram) && !titleSet.has(trigram) && /[\u4e00-\u9fa5]{3}/.test(trigram)) {
        result.push(trigram);
      }
    }

    // 按频率排序
    const freq = new Map<string, number>();
    for (const w of result) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }

    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([w]) => w);
  }

  // ============================================================
  // 通用工具
  // ============================================================

  /**
   * 长文本按句子边界拆分
   */
  private splitLongContent(content: string, maxLen: number): string[] {
    if (content.length <= maxLen) return [content];

    const segments: string[] = [];
    // 按句子分隔符切分
    const sentences = content.split(/(?<=[\u3002\uff1b\uff01\uff1f\n])\s*/);
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLen && current.length > 0) {
        segments.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }

    if (current.trim().length > 0) {
      segments.push(current.trim());
    }

    return segments.length > 0 ? segments : [content];
  }
}
