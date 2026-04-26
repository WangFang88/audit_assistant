import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'public_docs' })
export class PublicDocEntity {
  @PrimaryColumn({ name: 'doc_id', type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'file_path', type: 'varchar', length: 512 })
  filePath!: string;

  @Column({ name: 'uploaded_by', type: 'varchar', length: 64 })
  uploadedBy!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @Column({ name: 'vector_status', type: 'varchar', length: 32, default: 'queued' })
  vectorStatus!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;
}
