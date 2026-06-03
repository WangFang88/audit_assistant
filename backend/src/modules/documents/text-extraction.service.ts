import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface XlsxSheetData {
  sheetName: string;
  headers: string[];
  rows: Record<string, string>[];
}

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);
  private getAbsolutePath(sourcePath: string): string {
    // sourcePath: /files/public/doc-xxx/original.pdf or /files/teams/group-1/doc-xxx/original.pdf
    const relative = sourcePath.replace(/^\/files\//, '');
    return join(process.cwd(), '.data', 'uploads', relative);
  }

  async extractText(sourcePath: string, fileType: string): Promise<string> {
    const absPath = this.getAbsolutePath(sourcePath);
    const buffer = readFileSync(absPath);

    if (fileType === 'pdf') {
      return this.extractPdf(buffer);
    }

    if (fileType === 'docx') {
      return this.extractDocx(buffer);
    }

    if (fileType === 'xlsx') {
      return this.extractXlsx(buffer);
    }

    // image: return empty, caller will use OCR path
    return '';
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const pdf = require('pdf-parse');
      const data = await pdf(buffer);
      return data.text ?? '';
    } catch (err) {
      throw new Error(`PDF解析失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  }

  private extractXlsx(buffer: Buffer): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const texts: string[] = [];

    workbook.SheetNames.forEach((sheetName: string) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        texts.push(`[工作表: ${sheetName}]\n${csv}`);
      }
    });

    return texts.join('\n\n');
  }

  async extractXlsxStructured(sourcePath: string): Promise<XlsxSheetData[]> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require('xlsx');
    const absPath = this.getAbsolutePath(sourcePath);
    const buffer = readFileSync(absPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const result: XlsxSheetData[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rawData.length === 0) continue;

      // 构建合并单元格映射：被合并的行列 → 首单元格值
      const mergeMap = this.buildMergeMapFromSheet(rawData, sheet['!merges']);

      // 找到表头行：至少 3 个非空单元格（避免标题行等单列合并行被误判）
      const MIN_HEADER_CELLS = 3;
      const headerRowIdx = rawData.findIndex((row) => {
        let nonEmptyCount = 0;
        for (const cell of row) {
          if (String(cell ?? '').trim().length > 0) {
            nonEmptyCount++;
            if (nonEmptyCount >= MIN_HEADER_CELLS) return true;
          }
        }
        return false;
      });
      if (headerRowIdx < 0) continue;

      const headerRow = rawData[headerRowIdx].map((cell: any) => String(cell ?? '').trim());

      // 识别有效列（表头非空），过滤空表头列
      const validColIndices: number[] = [];
      const headers: string[] = [];
      for (let ci = 0; ci < headerRow.length; ci++) {
        if (headerRow[ci].length > 0) {
          validColIndices.push(ci);
          headers.push(headerRow[ci]);
        }
      }

      if (headers.length === 0) continue;

      // 处理数据行：从表头下一行开始
      const rows: Record<string, string>[] = [];
      for (let ri = headerRowIdx + 1; ri < rawData.length; ri++) {
        const rawRow = rawData[ri];
        const row: Record<string, string> = {};
        let hasValue = false;

        for (let hi = 0; hi < validColIndices.length; hi++) {
          const ci = validColIndices[hi];
          const header = headers[hi];

          // 检查是否为合并单元格（被合并的单元格），使用首单元格的值
          const mergeKey = `${ri},${ci}`;
          const cellValue = mergeMap.has(mergeKey)
            ? mergeMap.get(mergeKey)!
            : String(rawRow[ci] ?? '').trim();

          row[header] = cellValue;
          if (cellValue.length > 0) hasValue = true;
        }

        // 跳过全空行
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

  /**
   * 构建合并单元格映射表（需要 raw data）。
   * 对于每个合并区域，首单元格的值前向填充到区域内所有单元格。
   */
  private buildMergeMapFromSheet(rawData: any[][], merges: any[] | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!merges || merges.length === 0 || rawData.length === 0) return map;

    for (const merge of merges) {
      const { s, e } = merge; // s = start {r, c}, e = end {r, c}
      const firstValue = String(rawData[s.r]?.[s.c] ?? '').trim();
      if (firstValue.length === 0) continue;

      for (let r = s.r; r <= e.r; r++) {
        for (let c = s.c; c <= e.c; c++) {
          if (r === s.r && c === s.c) continue; // skip the first cell itself
          map.set(`${r},${c}`, firstValue);
        }
      }
    }

    return map;
  }
}
