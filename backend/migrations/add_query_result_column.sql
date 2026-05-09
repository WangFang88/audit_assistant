-- Add query_result column to query_logs table
ALTER TABLE query_logs ADD COLUMN IF NOT EXISTS query_result jsonb;
