-- Add allow_backward_navigation column to tests table
ALTER TABLE tests 
ADD COLUMN allow_backward_navigation BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN tests.allow_backward_navigation IS 'Determines whether test takers can navigate backward to previous questions';

-- Update existing tests to have backward navigation enabled by default
UPDATE tests SET allow_backward_navigation = true WHERE allow_backward_navigation IS NULL;