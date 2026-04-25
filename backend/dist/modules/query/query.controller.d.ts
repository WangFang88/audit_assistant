import { QueryRequestDto, QueryService } from './query.service';
export declare class QueryController {
    private readonly queryService;
    constructor(queryService: QueryService);
    search(dto: QueryRequestDto): {
        question: string;
        scope: {
            publicLibrary: boolean;
            groupId: string | null;
            groupName: string | null;
        };
        pipeline: string[];
        retrievalStats: {
            queryMode: string;
            tokenCount: number;
            candidateChunks: number;
            returnedCitations: number;
        };
        answer: string;
        citations: {
            documentId: string;
            title: string;
            libraryType: "public" | "private";
            score: number;
            matchedChunk: string;
            reason: string;
            articleRef: string;
            chapterTitle: string;
            pageLabel: string;
        }[];
        explanation: string;
    };
}
