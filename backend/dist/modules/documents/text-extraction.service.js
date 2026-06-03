"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TextExtractionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExtractionService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
let TextExtractionService = TextExtractionService_1 = class TextExtractionService {
    constructor() {
        this.logger = new common_1.Logger(TextExtractionService_1.name);
    }
    getAbsolutePath(sourcePath) {
        const relative = sourcePath.replace(/^\/files\//, '');
        return (0, node_path_1.join)(process.cwd(), '.data', 'uploads', relative);
    }
    async extractText(sourcePath, fileType) {
        const absPath = this.getAbsolutePath(sourcePath);
        const buffer = (0, node_fs_1.readFileSync)(absPath);
        if (fileType === 'pdf') {
            return this.extractPdf(buffer);
        }
        if (fileType === 'docx') {
            return this.extractDocx(buffer);
        }
        if (fileType === 'xlsx') {
            return this.extractXlsx(buffer);
        }
        return '';
    }
    async extractPdf(buffer) {
        try {
            const pdf = require('pdf-parse');
            const data = await pdf(buffer);
            return data.text ?? '';
        }
        catch (err) {
            throw new Error(`PDF解析失败: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async extractDocx(buffer) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value ?? '';
    }
    extractXlsx(buffer) {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const texts = [];
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            if (csv.trim()) {
                texts.push(`[工作表: ${sheetName}]\n${csv}`);
            }
        });
        return texts.join('\n\n');
    }
    async extractXlsxStructured(sourcePath) {
        const XLSX = require('xlsx');
        const absPath = this.getAbsolutePath(sourcePath);
        const buffer = (0, node_fs_1.readFileSync)(absPath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const result = [];
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            if (rawData.length === 0)
                continue;
            const mergeMap = this.buildMergeMapFromSheet(rawData, sheet['!merges']);
            const headerRowIdx = rawData.findIndex((row) => row.some((cell) => String(cell).trim().length > 0));
            if (headerRowIdx < 0)
                continue;
            const headerRow = rawData[headerRowIdx].map((cell) => String(cell ?? '').trim());
            const validColIndices = [];
            const headers = [];
            for (let ci = 0; ci < headerRow.length; ci++) {
                if (headerRow[ci].length > 0) {
                    validColIndices.push(ci);
                    headers.push(headerRow[ci]);
                }
            }
            if (headers.length === 0)
                continue;
            const rows = [];
            for (let ri = headerRowIdx + 1; ri < rawData.length; ri++) {
                const rawRow = rawData[ri];
                const row = {};
                let hasValue = false;
                for (let hi = 0; hi < validColIndices.length; hi++) {
                    const ci = validColIndices[hi];
                    const header = headers[hi];
                    const mergeKey = `${ri},${ci}`;
                    const cellValue = mergeMap.has(mergeKey)
                        ? mergeMap.get(mergeKey)
                        : String(rawRow[ci] ?? '').trim();
                    row[header] = cellValue;
                    if (cellValue.length > 0)
                        hasValue = true;
                }
                if (hasValue) {
                    rows.push(row);
                }
            }
            if (rows.length > 0) {
                result.push({ sheetName, headers, rows });
            }
        }
        return result;
    }
    buildMergeMapFromSheet(rawData, merges) {
        const map = new Map();
        if (!merges || merges.length === 0 || rawData.length === 0)
            return map;
        for (const merge of merges) {
            const { s, e } = merge;
            const firstValue = String(rawData[s.r]?.[s.c] ?? '').trim();
            if (firstValue.length === 0)
                continue;
            for (let r = s.r; r <= e.r; r++) {
                for (let c = s.c; c <= e.c; c++) {
                    if (r === s.r && c === s.c)
                        continue;
                    map.set(`${r},${c}`, firstValue);
                }
            }
        }
        return map;
    }
};
exports.TextExtractionService = TextExtractionService;
exports.TextExtractionService = TextExtractionService = TextExtractionService_1 = __decorate([
    (0, common_1.Injectable)()
], TextExtractionService);
//# sourceMappingURL=text-extraction.service.js.map