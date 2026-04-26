import { OverviewService } from './overview.service';
export declare class OverviewController {
    private readonly overviewService;
    constructor(overviewService: OverviewService);
    getDashboard(groupId?: string): {
        user: {
            id: string;
            name: string;
            phone: string;
            role: "admin" | "member";
            trialEndsAt: string;
        };
        activeContext: {
            groupId: string | null;
            groupName: string | null;
            queryScopeLabel: string;
            isolationNotice: string;
        };
        roadmap: {
            version: string;
            title: string;
            deadline: string;
            ragFocus: string;
        }[];
        architectureTargets: {
            generationProviderTarget: string;
            vectorStoreTarget: string;
            retrievalMode: string;
            parserTarget: string;
            deliveryMode: string;
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
            fileName: string;
            uploadedBy: string;
            chunkCount: number;
            indexStatus: "ready" | "processing" | "queued";
            extractionMode: "text" | "ocr";
            uploadedAt: string;
            groupId: string | null;
            fileType: "pdf" | "docx" | "xlsx" | "image";
            chunkStrategy: "structure-first" | "length-fallback";
            parserTarget: "multimodal-parser";
            embeddingTarget: "bge-large-zh";
            vectorStoreTarget: "pgvector";
            pipelineStage: "indexed" | "extracting" | "ocr" | "chunking" | "vectorizing" | "queued";
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
        libraryScope: {
            scopeMode: string;
            includesPublicLibrary: boolean;
            includesPrivateLibrary: boolean;
            publicDocumentCount: number;
            privateDocumentCount: number;
        };
        subscription: {
            currentPlanId: "free" | "weekly" | "monthly" | "yearly";
            trialEndsAt: string;
            trialDays: number;
            latestOrder: {
                id: string;
                planType: "free" | "weekly" | "monthly" | "yearly";
                amount: string;
                paidAt: string;
                expiredAt: string;
            } | null;
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
            limits: {
                maxGroups: number;
                maxPrivateDocuments: number;
                dailyQueryLimit: number;
                caseSearchEnabled: boolean;
                riskTablePreviewLimit: number;
            };
            planHighlights: string[];
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
            pricing: {
                weekly: string;
                monthly: string;
                yearly: string;
            };
        };
        conversations: {
            id: string;
            type: "group" | "direct";
            title: string;
            groupId: string | null;
            unreadCount: number;
            lastMessage: string;
        }[];
        featuredQuery: {
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
    };
}
