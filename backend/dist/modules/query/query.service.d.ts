import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
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
    constructor(documentsService: DocumentsService, groupsService: GroupsService);
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
        citations: CitationRecord[];
        explanation: string;
    };
}
export { QueryRequestDto };
