import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class QwenService {
  private readonly logger = new Logger(QwenService.name);
  private readonly apiKey = process.env.QWEN_API_KEY ?? '';
  private readonly model = process.env.QWEN_MODEL ?? 'qwen3-235b-a22b';
  private readonly endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  async generate(question: string, contextChunks: string[]): Promise<string | null> {
    if (!this.apiKey) return null;
    const context = contextChunks.slice(0, 6).join('\n\n');
    const prompt = `你是一名专业的审计助手。请根据以下知识库内容回答用户问题。

知识库内容：
${context}

用户问题：${question}

请按以下结构回答：
1. 问题分析：简要分析用户问题涉及的审计要点和关键问题
2. 结论：基于知识库内容给出明确的结论和建议

注意：引用条款和相关案例会在回答下方单独展示，无需在回答中重复列出。`;

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
