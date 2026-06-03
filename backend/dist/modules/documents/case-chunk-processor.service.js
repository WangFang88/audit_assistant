"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CaseChunkProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseChunkProcessorService = void 0;
const common_1 = require("@nestjs/common");
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
let CaseChunkProcessorService = CaseChunkProcessorService_1 = class CaseChunkProcessorService {
    constructor() {
        this.logger = new common_1.Logger(CaseChunkProcessorService_1.name);
        this.COLUMN_PATTERNS = {
            mainContent: /问题事实描述|问题概述|问题描述|违规事实|主要问题|审计发现问题|审计发现|事实描述|问题事实|问题$/,
            articleRef: /定性依据|违反条例|法规依据|法律法规|定性法规|问题依据|依据|违反.*规定|^依据$/,
            orgName: /组织名称|被审计单位|单位名称|^单位$|审计单位|机构名称|^组织$/,
            category: /问题类别|问题类型|问题分类|审计类别|^类别$/,
            metadata: /^证据$|充分性|佐证|备注|下户人员|审计人员|审计组|处理意见|处理.*情况|问题金额|涉及金额|^金额$|^序号$|^编号$/,
        };
    }
    buildImportedChunkId(documentId, index) {
        return `chunk-${documentId}-${index + 1}`;
    }
    buildXlsxCaseChunks(document, sheets) {
        const chunks = [];
        let globalIndex = 0;
        for (const sheet of sheets) {
            if (sheet.rows.length === 0)
                continue;
            const columnTypes = this.detectColumnTypes(sheet.headers);
            for (let rowIdx = 0; rowIdx < sheet.rows.length; rowIdx++) {
                const row = sheet.rows[rowIdx];
                const content = this.assembleContent(row, sheet.headers, columnTypes);
                const articleRef = this.extractArticleRef(row, columnTypes);
                const orgName = this.extractOrgName(row, columnTypes);
                if (content.trim().length < 10)
                    continue;
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
    detectColumnTypes(headers) {
        const result = {
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
            }
            else if (this.COLUMN_PATTERNS.orgName.test(trimmed)) {
                result.orgNameCols.push(trimmed);
            }
            else if (this.COLUMN_PATTERNS.category.test(trimmed)) {
                result.categoryCols.push(trimmed);
            }
            else if (this.COLUMN_PATTERNS.metadata.test(trimmed)) {
                result.metadataCols.push(trimmed);
            }
            else if (this.COLUMN_PATTERNS.mainContent.test(trimmed)) {
                result.mainContentCols.push(trimmed);
            }
            else {
                result.mainContentCols.push(trimmed);
            }
        }
        return result;
    }
    assembleContent(row, headers, columnTypes) {
        const parts = [];
        for (const col of columnTypes.orgNameCols) {
            const val = row[col]?.trim();
            if (val)
                parts.push(`[组织名称: ${val}]`);
        }
        for (const col of columnTypes.categoryCols) {
            const val = row[col]?.trim();
            if (val)
                parts.push(`[问题类别: ${val}]`);
        }
        for (const col of columnTypes.mainContentCols) {
            const val = row[col]?.trim();
            if (val)
                parts.push(val);
        }
        for (const col of columnTypes.metadataCols) {
            const val = row[col]?.trim();
            if (val)
                parts.push(`[${col}: ${val}]`);
        }
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
                if (val)
                    parts.push(`[${h}: ${val}]`);
            }
        }
        return parts.join('\n');
    }
    extractArticleRef(row, columnTypes) {
        for (const col of columnTypes.articleRefCols) {
            const val = row[col]?.trim();
            if (val)
                return val;
        }
        return '';
    }
    extractOrgName(row, columnTypes) {
        for (const col of columnTypes.orgNameCols) {
            const val = row[col]?.trim();
            if (val)
                return val;
        }
        return '';
    }
    buildTextCaseChunks(document, rawText) {
        const normalizedText = rawText.replace(/\r/g, '').trim();
        const casePattern = /(?=案例[一二三四五六七八九十\d]+[、：:.])/;
        const rawSegments = normalizedText.split(casePattern).filter(s => s.trim().length > 10);
        const mergedSegments = this.mergeShortSegments(rawSegments);
        if (mergedSegments.length === 0) {
            const paragraphs = normalizedText.split(/\n\n+/).filter(p => p.trim().length > 10);
            if (paragraphs.length === 0)
                return [];
            const grouped = [];
            for (let i = 0; i < paragraphs.length; i += 4) {
                grouped.push(paragraphs.slice(i, i + 4).join('\n\n'));
            }
            return this.buildChunksFromSegments(document, grouped);
        }
        const finalSegments = [];
        for (const seg of mergedSegments) {
            finalSegments.push(...this.splitLongContent(seg, 1200));
        }
        return this.buildChunksFromSegments(document, finalSegments);
    }
    mergeShortSegments(segments) {
        if (segments.length <= 1)
            return segments;
        const auditKeywords = /问题|条款|依据|定性|违规|处理|审计|规定|违反|法规|整改/;
        const result = [segments[0]];
        for (let i = 1; i < segments.length; i++) {
            const seg = segments[i];
            if (seg.length < 100 && !auditKeywords.test(seg)) {
                result[result.length - 1] += seg;
            }
            else {
                result.push(seg);
            }
        }
        return result;
    }
    buildChunksFromSegments(document, segments) {
        const titleKeywords = this.extractTitleKeywords(document.title);
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
    extractTitleKeywords(title) {
        return title
            .replace(/[()\uff08\uff09_.\/-]+/g, ' ')
            .split(/[\s]+/)
            .filter(item => item.length >= 2);
    }
    extractContentKeywords(text, titleKeywords) {
        const titleSet = new Set(titleKeywords);
        const words = text
            .replace(/[\uff0c\u3002\uff1b\uff1a\u3001\u201c\u201d\u2018\u2019\uff08\uff09()\u3010\u3011\[\]\-【】\n\r]/g, ' ')
            .split(/[\s]+/)
            .filter(item => item.length >= 2);
        const filtered = words.filter(w => !STOP_WORDS.has(w) && !titleSet.has(w));
        const freq = new Map();
        for (const w of filtered) {
            freq.set(w, (freq.get(w) || 0) + 1);
        }
        const sorted = [...freq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([w]) => w);
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
    extractNgrams(text, titleSet, count) {
        const cleaned = text
            .replace(/[\uff0c\u3002\uff1b\uff1a\u3001\u201c\u201d\u2018\u2019\uff08\uff09()\u3010\u3011\[\]\-【】\n\r]/g, '')
            .replace(/\s+/g, '');
        const result = [];
        for (let i = 0; i < cleaned.length - 1; i++) {
            const bigram = cleaned.substring(i, i + 2);
            if (!STOP_WORDS.has(bigram) && !titleSet.has(bigram) && /[\u4e00-\u9fa5]{2}/.test(bigram)) {
                result.push(bigram);
            }
        }
        for (let i = 0; i < cleaned.length - 2; i++) {
            const trigram = cleaned.substring(i, i + 3);
            if (!STOP_WORDS.has(trigram) && !titleSet.has(trigram) && /[\u4e00-\u9fa5]{3}/.test(trigram)) {
                result.push(trigram);
            }
        }
        const freq = new Map();
        for (const w of result) {
            freq.set(w, (freq.get(w) || 0) + 1);
        }
        return [...freq.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([w]) => w);
    }
    splitLongContent(content, maxLen) {
        if (content.length <= maxLen)
            return [content];
        const segments = [];
        const sentences = content.split(/(?<=[\u3002\uff1b\uff01\uff1f\n])\s*/);
        let current = '';
        for (const sentence of sentences) {
            if ((current + sentence).length > maxLen && current.length > 0) {
                segments.push(current.trim());
                current = sentence;
            }
            else {
                current += sentence;
            }
        }
        if (current.trim().length > 0) {
            segments.push(current.trim());
        }
        return segments.length > 0 ? segments : [content];
    }
};
exports.CaseChunkProcessorService = CaseChunkProcessorService;
exports.CaseChunkProcessorService = CaseChunkProcessorService = CaseChunkProcessorService_1 = __decorate([
    (0, common_1.Injectable)()
], CaseChunkProcessorService);
//# sourceMappingURL=case-chunk-processor.service.js.map