-- 迁移：扩展 library_type 字段，支持 6 种库类型
-- 原值：'public' | 'private'
-- 新值：'regulation' | 'local_policy' | 'national_case' | 'local_case' | 'industry' | 'private'

-- 1. 扩展字段长度（16 -> 32）
ALTER TABLE documents ALTER COLUMN library_type TYPE varchar(32);
ALTER TABLE document_chunks ALTER COLUMN library_type TYPE varchar(32);

-- 2. 将旧的 'public' 数据迁移为 'regulation'
UPDATE documents SET library_type = 'regulation' WHERE library_type = 'public';
UPDATE document_chunks SET library_type = 'regulation' WHERE library_type = 'public';
