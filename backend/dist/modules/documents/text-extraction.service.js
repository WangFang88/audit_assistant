"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExtractionService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const pdfParse = require("pdf-parse");
let TextExtractionService = class TextExtractionService {
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
            const result = await pdfParse(buffer);
            return result.text ?? '';
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
};
exports.TextExtractionService = TextExtractionService;
exports.TextExtractionService = TextExtractionService = __decorate([
    (0, common_1.Injectable)()
], TextExtractionService);
//# sourceMappingURL=text-extraction.service.js.map