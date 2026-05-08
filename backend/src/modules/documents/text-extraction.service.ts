import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class TextExtractionService {
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
      const pdfParseModule = require('pdf-parse');
      const parseFunction = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;
      const result = await parseFunction(buffer);
      return result.text ?? '';
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
}
