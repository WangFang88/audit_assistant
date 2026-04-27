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

    // xlsx / image: return empty, caller will use OCR path
    return '';
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const result = await pdfParse(buffer);
    return result.text ?? '';
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  }
}
