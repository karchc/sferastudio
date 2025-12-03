-- Add session progress tracking fields to test_sessions table
-- This allows us to resume tests from where the user left off

ALTER TABLE test_sessions
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the session_data field
COMMENT ON COLUMN test_sessions.session_data IS 'Stores session state including flagged questions, navigation history, etc.';

-- Create index for faster querying of active sessions
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_status
ON test_sessions(user_id, status)
WHERE status = 'in_progress';
