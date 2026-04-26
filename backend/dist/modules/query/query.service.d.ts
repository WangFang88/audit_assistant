import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
declare class QueryRequestDto {
    question: string;
    groupId?: string;
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
    private readonly documentsService;
    private readonly groupsService;
    private readonly subscriptionsService;
    constructor(documentsService: DocumentsService, groupsService: GroupsService, subscriptionsService: SubscriptionsService);
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
        citations: CitationRecord[];
        explanation: string;
    };
}
export { QueryRequestDto };
