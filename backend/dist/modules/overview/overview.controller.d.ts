import { OverviewService } from './overview.service';
export declare class OverviewController {
    private readonly overviewService;
    constructor(overviewService: OverviewService);
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
