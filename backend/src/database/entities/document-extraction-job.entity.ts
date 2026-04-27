import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'document_extraction_jobs' })
export class DocumentExtractionJobEntity {
  @PrimaryColumn({ name: 'job_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'doc_id', type: 'varchar', length: 64 })
  documentId!: string;

  @Column({ name: 'team_id', type: 'varchar', length: 64, nullable: true })
  teamId!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'queued' })
  status!: 'queued' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'stage', type: 'varchar', length: 16 })
  stage!: 'extract' | 'ocr' | 'chunk' | 'index';

  @Column({ name: 'progress', type: 'int', default: 0 })
  progress!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'started_at', type: 'timestamp' })
  startedAt!: Date;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt!: Date | null;
}
