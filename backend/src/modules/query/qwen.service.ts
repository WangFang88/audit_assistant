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
1. 问题分析：简要分析用户问题涉及的审计要点和关键问题，明确指出适用的法规条款
2. 结论：针对问题分析中提到的每个要点和条款，逐一给出明确的结论
3. 建议：基于上述分析和结论，提供具体的审计建议和注意事项

要求：
- 确保结论部分完整覆盖问题分析中提到的所有条款和要点
- 结论要具体明确，避免笼统概括
- 引用条款和相关案例会在回答下方单独展示，无需在回答中重复列出

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
