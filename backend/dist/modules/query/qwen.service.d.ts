export declare class QwenService {
    private readonly logger;
    private readonly apiKey;
    private readonly model;
    private readonly endpoint;
    generate(question: string, contextChunks: string[]): Promise<string | null>;
    generateFromPrompt(prompt: string): Promise<string | null>;
}
