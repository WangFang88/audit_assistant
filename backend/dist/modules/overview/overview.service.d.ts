import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { QueryService } from '../query/query.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
export declare class OverviewService {
    private readonly authService;
    private readonly groupsService;
    private readonly documentsService;
    private readonly queryService;
    private readonly chatService;
    private readonly subscriptionsService;
    constructor(authService: AuthService, groupsService: GroupsService, documentsService: DocumentsService, queryService: QueryService, chatService: ChatService, subscriptionsService: SubscriptionsService);
    getDashboard(groupId?: string): {
        user: {
            id: string;
            name: string;
            phone: string;
            role: string;
            trialEndsAt: string;
        };
        groups: {
            id: string;
            name: string;
            organizationName: string;
            ownerUserId: string;
            memberCount: number;
            privateDocumentCount: number;
            lastQueryAt: string | null;
        }[];
        members: {
            id: string;
            groupId: string;
            userId: string;
            name: string;
            phone: string;
            role: "leader" | "member";
        }[];
        documents: {
            id: string;
            title: string;
            libraryType: "public" | "private";
            sourcePath: string;
            chunkCount: number;
            indexStatus: "ready" | "processing" | "queued";
            extractionMode: "text" | "ocr";
            uploadedAt: string;
            groupId: string | null;
            fileType: "pdf" | "docx" | "xlsx" | "image";
            chunkStrategy: "structure-first" | "length-fallback";
        }[];
        extractJobs: {
            id: string;
            documentId: string;
            groupId: string | null;
            status: "processing" | "queued" | "completed";
            stage: "extract" | "ocr" | "chunk" | "index";
            progress: number;
            startedAt: string;
        }[];
        subscription: {
            currentPlanId: string;
            trialEndsAt: string;
            usage: {
                groups: {
                    used: number;
                    limit: number;
                };
                privateDocuments: {
                    used: number;
                    limit: number;
                };
                dailyQueries: {
                    used: number;
                    limit: number;
                };
            };
            plans: {
                id: string;
                name: string;
                priceLabel: string;
                limits: {
                    groupCount: number;
                    privateDocuments: number;
                    dailyQueries: number;
                    caseSearch: boolean;
                };
            }[];
        };
        conversations: ({
            id: string;
            type: string;
            title: string;
            groupId: string;
            unreadCount: number;
            lastMessage: string;
        } | {
            id: string;
            type: string;
            title: string;
            groupId: null;
            unreadCount: number;
            lastMessage: string;
        })[];
        featuredQuery: {
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
    };
}
