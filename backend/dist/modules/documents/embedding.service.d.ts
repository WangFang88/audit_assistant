export declare class EmbeddingService {
    private readonly logger;
    private readonly apiKey;
    private readonly model;
    private readonly endpoint;
    embed(text: string): Promise<number[] | null>;
    cosineSimilarity(a: number[], b: number[]): number;
}
