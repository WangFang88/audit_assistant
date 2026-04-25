import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { DocumentsService } from '../documents/documents.service';
import { GroupsService } from '../groups/groups.service';
import { QueryService } from '../query/query.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class OverviewService {
  constructor(
    private readonly authService: AuthService,
    private readonly groupsService: GroupsService,
    private readonly documentsService: DocumentsService,
    private readonly queryService: QueryService,
    private readonly chatService: ChatService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  getDashboard(groupId?: string) {
    const groups = this.groupsService.listGroups();
    const effectiveGroupId = groupId ?? groups[0]?.id;

    return {
      user: this.authService.me(),
      groups,
      members: effectiveGroupId ? this.groupsService.listMembers(effectiveGroupId) : [],
      documents: this.documentsService.listDocuments(effectiveGroupId),
      extractJobs: this.documentsService.listExtractionJobs(effectiveGroupId),
      subscription: this.subscriptionsService.getOverview(),
      conversations: this.chatService.listConversations(effectiveGroupId),
      featuredQuery: this.queryService.search({
        question: '请检索与专项资金使用和采购审批相关的制度依据。',
        groupId: effectiveGroupId,
      }),
    };
  }
}
