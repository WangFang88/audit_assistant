import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QwenService {
  private readonly logger = new Logger(QwenService.name);
  private readonly apiKey = process.env.QWEN_API_KEY ?? '';
  private readonly model = process.env.QWEN_MODEL ?? 'qwen-plus';
  private readonly endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  async generate(question: string, contextChunks: string[]): Promise<string | null> {
    if (!this.apiKey) return null;
    const context = contextChunks.slice(0, 6).join('\n\n');
    const prompt = `你是一名专业的审计助手。请根据以下知识库内容回答用户问题，回答要准确、简洁，并引用相关条款。

知识库内容：
${context}

用户问题：${question}

请基于以上内容给出专业回答：`;

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Qwen API error: ${res.status}`);
        return null;
      }
      const json = (await res.json()) as { choices: { message: { content: string } }[] };
      return json.choices[0]?.message?.content ?? null;
    } catch (err) {
      this.logger.warn(`Qwen request failed: ${err}`);
      return null;
    }
  }
}
