import { AuthService } from '../auth/auth.service';
import { DocumentsService } from '../documents/documents.service';
import { EmbeddingService } from '../documents/embedding.service';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
import { QwenService } from './qwen.service';
declare class QueryRequestDto {
    question: string;
    groupId?: string;
    agentId?: string;
}
type CitationRecord = {
    documentId: string;
    title: string;
    libraryType: 'public' | 'private';
    score: number;
    matchedChunk: string;
    reason: string;
    articleRef: string;
    chapterTitle: string;
    pageLabel: string;
};
export declare class QueryService {
    private readonly authService;
    private readonly documentsService;
    private readonly embeddingService;
    private readonly groupsService;
    private readonly subscriptionsService;
    private readonly teamAgentsService;
    private readonly qwenService;
    constructor(authService: AuthService, documentsService: DocumentsService, embeddingService: EmbeddingService, groupsService: GroupsService, subscriptionsService: SubscriptionsService, teamAgentsService: TeamAgentsService, qwenService: QwenService);
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
        citations: CitationRecord[];
        explanation: string;
    }>;
}
export { QueryRequestDto };
