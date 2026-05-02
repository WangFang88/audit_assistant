import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryColumn({ name: 'doc_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'file_path', type: 'varchar', length: 512 })
  filePath!: string;

  @Column({ name: 'file_type', type: 'varchar', length: 32, default: 'pdf' })
  fileType!: string;

  @Column({ name: 'library_type', type: 'varchar', length: 32 })
  libraryType!: 'regulation' | 'local_policy' | 'national_case' | 'local_case' | 'industry' | 'private';

  @Column({ name: 'region', type: 'varchar', length: 64, nullable: true })
  region!: string | null;

  @Column({ name: 'team_id', type: 'varchar', length: 64, nullable: true })
  teamId!: string | null;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 64 })
  uploadedBy!: string;

  @Column({ name: 'upload_source', type: 'varchar', length: 32, nullable: true })
  uploadSource!: string | null;

  @Column({ name: 'index_status', type: 'varchar', length: 32, default: 'queued' })
  indexStatus!: string;

  @Column({ name: 'extraction_mode', type: 'varchar', length: 16, nullable: true })
  extractionMode!: string | null;

  @Column({ name: 'parser_target', type: 'varchar', length: 64, default: 'multimodal-parser' })
  parserTarget!: string;

  @Column({ name: 'embedding_target', type: 'varchar', length: 64, default: 'bge-large-zh' })
  embeddingTarget!: string;

  @Column({ name: 'vector_store_target', type: 'varchar', length: 64, default: 'pgvector' })
  vectorStoreTarget!: string;

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount!: number;

  @Column({ name: 'raw_text_length', type: 'int', default: 0 })
  rawTextLength!: number;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @Column({ name: 'indexed_at', type: 'timestamp', nullable: true })
  indexedAt!: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
