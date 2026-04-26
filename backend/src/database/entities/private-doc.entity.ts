import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'private_docs' })
export class PrivateDocEntity {
  @PrimaryColumn({ name: 'doc_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64 })
  teamId!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'file_path', type: 'varchar', length: 512 })
  filePath!: string;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 64 })
  uploadedBy!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @Column({ name: 'index_status', type: 'varchar', length: 32, default: 'queued' })
  indexStatus!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 32, default: 'pdf' })
  fileType!: string;

  @Column({ name: 'parser_target', type: 'varchar', length: 64, default: 'multimodal-parser' })
  parserTarget!: string;

  @Column({ name: 'embedding_target', type: 'varchar', length: 64, default: 'bge-large-zh' })
  embeddingTarget!: string;

  @Column({ name: 'vector_store_target', type: 'varchar', length: 64, default: 'pgvector' })
  vectorStoreTarget!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;
}
