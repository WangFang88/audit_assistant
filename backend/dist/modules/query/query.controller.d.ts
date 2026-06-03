import { QueryRequestDto, QueryService } from './query.service';
export declare class QueryController {
    private readonly queryService;
    constructor(queryService: QueryService);
    search(dto: QueryRequestDto): Promise<{
        question: string;
        agentMode: boolean;
        agent: {
            id: string;
            name: string;
            groupId: string;
            capabilities: import("../team-agents/team-agents.service").TeamAgentCapability[];
            defaultConversationId: string | null;
            retrievalScope: "public_plus_group_private";
        } | null;
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
            libraryType: import("../documents/library-type").LibraryType;
            score: number;
            matchedChunk: string;
            reason: string;
            articleRef: string;
            chapterTitle: string;
            pageLabel: string;
        }[];
        similarCases: {
            documentId: string;
            title: string;
            libraryType: import("../documents/library-type").LibraryType;
            score: number;
            matchedChunk: string;
            reason: string;
            articleRef: string;
            chapterTitle: string;
            pageLabel: string;
        }[];
        riskTable: {
            topic: string;
            summary: string;
            columns: string[];
            rows: {
                index: number;
                riskPoint: string;
                checkContent: string;
                legalBasis: string;
                caseReference: string;
                evidenceMaterials: string;
                riskLevel: "中" | "高" | "低";
                detail: {
                    explanation: string;
                    legalBasisDetails: string[];
                    caseDetails: string[];
                    evidenceSuggestions: string[];
                    possibleFindings: string[];
                    rectificationSuggestions: string[];
                };
            }[];
        } | null;
        explanation: string;
    }>;
}
