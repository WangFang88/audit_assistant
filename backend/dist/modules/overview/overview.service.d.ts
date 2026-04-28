import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { QueryService } from '../query/query.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TeamAgentsService } from '../team-agents/team-agents.service';
export declare class OverviewService {
    private readonly authService;
    private readonly groupsService;
    private readonly documentsService;
    private readonly queryService;
    private readonly chatService;
    private readonly subscriptionsService;
    private readonly teamAgentsService;
    private readonly auditService;
    constructor(authService: AuthService, groupsService: GroupsService, documentsService: DocumentsService, queryService: QueryService, chatService: ChatService, subscriptionsService: SubscriptionsService, teamAgentsService: TeamAgentsService, auditService: AuditService);
    getDashboard(groupId?: string): Promise<{
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
            agentId: string | null;
            agentName: string | null;
            agentCapabilities: import("../team-agents/team-agents.service").TeamAgentCapability[];
            knowledgeScopeLabel: string;
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
            role: "member" | "leader";
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
            currentPlanId: string;
            trialEndsAt: string;
            trialDays: number;
            status: "active" | "admin-preview" | "trial" | "expired";
            statusLabel: string;
            latestOrder: {
                id: string;
                planType: "free" | "weekly" | "monthly" | "yearly";
                planLabel: "free" | "免费版" | "weekly" | "周订阅" | "monthly" | "月订阅" | "yearly" | "年订阅";
                amount: string;
                paidAt: string;
                expiredAt: string;
            } | null;
            effectiveOrder: {
                id: string;
                planType: "free" | "weekly" | "monthly" | "yearly";
                planLabel: "free" | "免费版" | "weekly" | "周订阅" | "monthly" | "月订阅" | "yearly" | "年订阅";
                amount: string;
                paidAt: string;
                expiredAt: string;
            } | null;
            orderHistory: {
                id: string;
                planType: "free" | "weekly" | "monthly" | "yearly";
                planLabel: "free" | "免费版" | "weekly" | "周订阅" | "monthly" | "月订阅" | "yearly" | "年订阅";
                amount: string;
                paidAt: string;
                expiredAt: string;
            }[];
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
            plans: readonly [{
                readonly id: "free";
                readonly name: "免费版";
                readonly priceLabel: "¥0 / 1天试用";
                readonly activationLabel: "免费试用";
                readonly limits: {
                    readonly groupCount: 1;
                    readonly privateDocuments: 2;
                    readonly dailyQueries: 10;
                    readonly caseSearch: false;
                };
            }, {
                readonly id: "weekly";
                readonly name: "周订阅";
                readonly priceLabel: "¥70 / 周";
                readonly activationLabel: "模拟开通周订阅";
                readonly limits: {
                    readonly groupCount: 5;
                    readonly privateDocuments: 50;
                    readonly dailyQueries: 200;
                    readonly caseSearch: true;
                };
            }, {
                readonly id: "monthly";
                readonly name: "月订阅";
                readonly priceLabel: "¥200 / 月";
                readonly activationLabel: "模拟开通月订阅";
                readonly limits: {
                    readonly groupCount: 20;
                    readonly privateDocuments: 200;
                    readonly dailyQueries: 1000;
                    readonly caseSearch: true;
                };
            }, {
                readonly id: "yearly";
                readonly name: "年订阅";
                readonly priceLabel: "¥2000 / 年";
                readonly activationLabel: "模拟开通年订阅";
                readonly limits: {
                    readonly groupCount: 100;
                    readonly privateDocuments: 1000;
                    readonly dailyQueries: 5000;
                    readonly caseSearch: true;
                };
            }];
            pricing: {
                weekly: string;
                monthly: string;
                yearly: string;
            };
        };
        recentAuditEvents: import("../../database/repositories/audit-event.repository").AuditEventSnapshot[];
        conversations: {
            id: string;
            type: "group" | "direct" | "agent";
            title: string;
            groupId: string | null;
            isTeamAgent: boolean;
            unreadCount: number;
            lastMessage: string;
            lastMessageAt: string;
        }[];
        activeTeamAgent: {
            id: string;
            name: string;
            groupId: string;
            capabilities: import("../team-agents/team-agents.service").TeamAgentCapability[];
            defaultConversationId: string | null;
            retrievalScope: "public_plus_group_private";
        } | null;
        featuredQuery: {
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
    }>;
}
