import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'document_chunks' })
export class DocumentChunkEntity {
  @PrimaryColumn({ name: 'chunk_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'doc_id', type: 'varchar', length: 64 })
  documentId!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64, nullable: true })
  teamId!: string | null;

  @Column({ name: 'library_type', type: 'varchar', length: 32 })
  libraryType!: 'regulation' | 'local_policy' | 'national_case' | 'local_case' | 'industry' | 'private';

  @Column({ name: 'region', type: 'varchar', length: 64, nullable: true })
  region!: string | null;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'chapter_title', type: 'varchar', length: 255, nullable: true })
  chapterTitle!: string | null;

  @Column({ name: 'article_ref', type: 'varchar', length: 128, nullable: true })
  articleRef!: string | null;

  @Column({ name: 'page_label', type: 'varchar', length: 64, nullable: true })
  pageLabel!: string | null;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'keywords', type: 'jsonb', default: () => "'[]'::jsonb" })
  keywords!: string[];

  @Column({ name: 'chunk_index', type: 'int', default: 0 })
  chunkIndex!: number;

  @Column({ name: 'index_status', type: 'varchar', length: 16, default: 'processing' })
  indexStatus!: 'ready' | 'processing' | 'failed';

  @Column({ name: 'token_count', type: 'int', default: 0 })
  tokenCount!: number;

  @Column({ name: 'embedding', type: 'jsonb', nullable: true })
  embedding!: number[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
