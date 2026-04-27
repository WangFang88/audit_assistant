"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmbeddingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const common_1 = require("@nestjs/common");
let EmbeddingService = EmbeddingService_1 = class EmbeddingService {
    constructor() {
        this.logger = new common_1.Logger(EmbeddingService_1.name);
        this.apiKey = process.env.SILICONFLOW_API_KEY ?? '';
        this.model = process.env.SILICONFLOW_EMBEDDING_MODEL ?? 'BAAI/bge-large-zh-v1.5';
        this.endpoint = 'https://api.siliconflow.cn/v1/embeddings';
    }
    async embed(text) {
        if (!this.apiKey || this.apiKey === 'your_api_key_here') {
            return null;
        }
        try {
            const res = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
                body: JSON.stringify({ model: this.model, input: [text] }),
            });
            if (!res.ok) {
                this.logger.warn(`Embedding API error: ${res.status}`);
                return null;
            }
            const json = (await res.json());
            return json.data[0]?.embedding ?? null;
        }
        catch (err) {
            this.logger.warn(`Embedding request failed: ${err}`);
            return null;
        }
    }
    cosineSimilarity(a, b) {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
};
exports.EmbeddingService = EmbeddingService;
exports.EmbeddingService = EmbeddingService = EmbeddingService_1 = __decorate([
    (0, common_1.Injectable)()
], EmbeddingService);
//# sourceMappingURL=embedding.service.js.map