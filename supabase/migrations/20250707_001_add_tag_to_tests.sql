-- Add tag field to tests table
-- 250707: Add tag field for test organization and filtering

-- Add tag column to tests table
ALTER TABLE tests 
ADD COLUMN tag TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tests.tag IS 'Optional tag for categorizing and organizing tests (e.g., "Beginner", "Advanced", "Mock Exam")';

-- Create index for tag filtering performance
CREATE INDEX IF NOT EXISTS idx_tests_tag ON tests(tag);

-- Update RLS policies to include tag field (existing policies should work fine)
-- No RLS changes needed as tag is a public field for organization purposes