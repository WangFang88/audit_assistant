"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QwenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QwenService = void 0;
const common_1 = require("@nestjs/common");
let QwenService = QwenService_1 = class QwenService {
    constructor() {
        this.logger = new common_1.Logger(QwenService_1.name);
        this.apiKey = process.env.QWEN_API_KEY ?? '';
        this.model = process.env.QWEN_MODEL ?? 'qwen-plus';
        this.endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    }
    async generate(question, contextChunks) {
        if (!this.apiKey)
            return null;
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
            const json = (await res.json());
            return json.choices[0]?.message?.content ?? null;
        }
        catch (err) {
            this.logger.warn(`Qwen request failed: ${err}`);
            return null;
        }
    }
};
exports.QwenService = QwenService;
exports.QwenService = QwenService = QwenService_1 = __decorate([
    (0, common_1.Injectable)()
], QwenService);
//# sourceMappingURL=qwen.service.js.map