import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey = process.env.SILICONFLOW_API_KEY ?? '';
  private readonly model = process.env.SILICONFLOW_EMBEDDING_MODEL ?? 'BAAI/bge-large-zh-v1.5';
  private readonly endpoint = 'https://api.siliconflow.cn/v1/embeddings';

  async embed(text: string): Promise<number[] | null> {
    if (!this.apiKey || this.apiKey === 'your_api_key_here') {
      return null;
    }
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: this.model, input: text, encoding_format: 'float' }),
      });
      if (!res.ok) {
        this.logger.warn(`Embedding API error: ${res.status}`);
        return null;
      }
      const json = (await res.json()) as { data: { embedding: number[] }[] };
      return json.data[0]?.embedding ?? null;
    } catch (err) {
      this.logger.warn(`Embedding request failed: ${err}`);
      return null;
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
