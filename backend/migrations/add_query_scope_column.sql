-- Add query_scope column to query_logs table
ALTER TABLE query_logs ADD COLUMN IF NOT EXISTS query_scope varchar(32);
