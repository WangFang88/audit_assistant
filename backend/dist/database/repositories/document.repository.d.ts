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
export declare class DocumentRepository {
    createPublicDocEntity(snapshot: DocumentMetadataSnapshot): PublicDocEntity;
    createPrivateDocEntity(snapshot: DocumentMetadataSnapshot): PrivateDocEntity;
}
