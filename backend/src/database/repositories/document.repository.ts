import { Injectable } from '@nestjs/common';
import { PrivateDocEntity } from '../entities/private-doc.entity';
import { PublicDocEntity } from '../entities/public-doc.entity';

export type DocumentMetadataSnapshot = {
  id: string;
  title: string;
  libraryType: 'public' | 'private';
  sourcePath: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  indexStatus: 'ready' | 'processing' | 'queued';
  groupId: string | null;
  fileType: 'pdf' | 'docx' | 'xlsx' | 'image';
  parserTarget: 'multimodal-parser';
  embeddingTarget: 'bge-large-zh';
  vectorStoreTarget: 'pgvector';
};

@Injectable()
export class DocumentRepository {
  createPublicDocEntity(snapshot: DocumentMetadataSnapshot): PublicDocEntity {
    const entity = new PublicDocEntity();
    entity.id = snapshot.id;
    entity.title = snapshot.title;
    entity.fileName = snapshot.fileName;
    entity.filePath = snapshot.sourcePath;
    entity.uploadedBy = snapshot.uploadedBy;
    entity.uploadedAt = new Date(snapshot.uploadedAt.replace(' ', 'T'));
    entity.indexStatus = snapshot.indexStatus;
    entity.fileType = snapshot.fileType;
    entity.parserTarget = snapshot.parserTarget;
    entity.embeddingTarget = snapshot.embeddingTarget;
    entity.vectorStoreTarget = snapshot.vectorStoreTarget;
    return entity;
  }

  createPrivateDocEntity(snapshot: DocumentMetadataSnapshot): PrivateDocEntity {
    const entity = new PrivateDocEntity();
    entity.id = snapshot.id;
    entity.teamId = snapshot.groupId ?? 'unknown';
    entity.title = snapshot.title;
    entity.fileName = snapshot.fileName;
    entity.filePath = snapshot.sourcePath;
    entity.uploadedBy = snapshot.uploadedBy;
    entity.uploadedAt = new Date(snapshot.uploadedAt.replace(' ', 'T'));
    entity.indexStatus = snapshot.indexStatus;
    entity.fileType = snapshot.fileType;
    entity.parserTarget = snapshot.parserTarget;
    entity.embeddingTarget = snapshot.embeddingTarget;
    entity.vectorStoreTarget = snapshot.vectorStoreTarget;
    return entity;
  }
}
