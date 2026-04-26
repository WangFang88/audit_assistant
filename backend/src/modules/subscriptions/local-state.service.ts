import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

type PersistedGroupRecord = {
  id: string;
  name: string;
  organizationName: string;
  ownerUserId: string;
  memberCount: number;
  privateDocumentCount: number;
  lastQueryAt: string | null;
};

type PersistedMemberRecord = {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  phone: string;
  role: 'leader' | 'member';
};

type PersistedDocumentRecord = {
  id: string;
  title: string;
  libraryType: 'public' | 'private';
  sourcePath: string;
  chunkCount: number;
  indexStatus: 'ready' | 'processing' | 'queued';
  extractionMode: 'text' | 'ocr';
  uploadedAt: string;
  groupId: string | null;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'image';
  chunkStrategy: 'structure-first' | 'length-fallback';
  parserTarget: 'multimodal-parser';
  embeddingTarget: 'bge-large-zh';
  vectorStoreTarget: 'pgvector';
  pipelineStage: 'indexed' | 'extracting' | 'ocr' | 'chunking' | 'vectorizing' | 'queued';
};

type PersistedChunkRecord = {
  id: string;
  documentId: string;
  groupId: string | null;
  libraryType: 'public' | 'private';
  title: string;
  chapterTitle: string;
  articleRef: string;
  pageLabel: string;
  content: string;
  keywords: string[];
  indexStatus: 'ready' | 'processing';
};

type PersistedUsageSnapshot = {
  groups: number;
  privateDocuments: number;
  dailyQueries: number;
  dailyQueryDate: string;
};

type PersistedConversationRecord = {
  id: string;
  type: 'group' | 'direct';
  title: string;
  groupId: string | null;
  unreadCount?: number;
  lastMessage?: string;
};

type PersistedMessageRecord = {
  id: string;
  conversationId: string;
  senderUserId?: string;
  receiverUserId?: string | null;
  senderName: string;
  content: string;
  sentAt: string;
  readStatus?: boolean;
};

type PersistedUserRecord = {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'member';
  trialEndsAt: string;
  password: string;
};

type PersistedQueryLogRecord = {
  id: string;
  userId: string;
  teamId: string | null;
  queryText: string;
  queriedAt: string;
  consumedQuota: number;
};

type PersistedSubscriptionRecord = {
  id: string;
  userId: string;
  planType: 'free' | 'weekly' | 'monthly' | 'yearly';
  amount: string;
  paidAt: string;
  expiredAt: string;
};

type PersistedState = {
  groups?: PersistedGroupRecord[];
  members?: PersistedMemberRecord[];
  documents?: PersistedDocumentRecord[];
  chunks?: PersistedChunkRecord[];
  usage?: PersistedUsageSnapshot;
  conversations?: PersistedConversationRecord[];
  messages?: PersistedMessageRecord[];
  users?: PersistedUserRecord[];
  queryLogs?: PersistedQueryLogRecord[];
  subscriptions?: PersistedSubscriptionRecord[];
};

@Injectable()
export class LocalStateService {
  private readonly filePath = resolve(process.cwd(), '.data', 'app-state.json');

  readState(): PersistedState {
    try {
      if (!existsSync(this.filePath)) {
        return {};
      }

      const raw = readFileSync(this.filePath, 'utf8');
      if (raw.trim().length === 0) {
        return {};
      }

      return JSON.parse(raw) as PersistedState;
    } catch {
      return {};
    }
  }

  saveGroups(groups: PersistedGroupRecord[], members: PersistedMemberRecord[]) {
    this.writeState({ groups, members });
  }

  saveDocuments(documents: PersistedDocumentRecord[]) {
    this.writeState({ documents });
  }

  saveChunks(chunks: PersistedChunkRecord[]) {
    this.writeState({ chunks });
  }

  saveUsage(usage: PersistedUsageSnapshot) {
    this.writeState({ usage });
  }

  saveChatState(conversations: PersistedConversationRecord[], messages: PersistedMessageRecord[]) {
    this.writeState({ conversations, messages });
  }

  saveUsers(users: PersistedUserRecord[]) {
    this.writeState({ users });
  }

  saveQueryLogs(queryLogs: PersistedQueryLogRecord[]) {
    this.writeState({ queryLogs });
  }

  saveSubscriptions(subscriptions: PersistedSubscriptionRecord[]) {
    this.writeState({ subscriptions });
  }

  private writeState(partial: PersistedState) {
    const nextState: PersistedState = {
      ...this.readState(),
      ...partial,
    };

    const parentDir = dirname(this.filePath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    writeFileSync(this.filePath, JSON.stringify(nextState, null, 2), 'utf8');
  }
}
