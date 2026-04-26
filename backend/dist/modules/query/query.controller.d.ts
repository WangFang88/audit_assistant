import { QueryRequestDto, QueryService } from './query.service';
export declare class QueryController {
    private readonly queryService;
    constructor(queryService: QueryService);
    search(dto: QueryRequestDto): {
        question: string;
        scope: {
            scopeMode: string;
            label: string;
            publicLibrary: boolean;
            privateLibrary: boolean;
            groupId: string | null;
            groupName: string | null;
            isolationNotice: string;
        };
        pipeline: string[];
        retrievalStats: {
            queryMode: string;
            tokenCount: number;
            candidateChunks: number;
            returnedCitations: number;
            publicLibraryHits: number;
            privateLibraryHits: number;
        };
        ragMeta: {
            retrievalMode: string;
            generationProviderTarget: string;
            prototypeMode: string;
            answerTraceable: boolean;
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
