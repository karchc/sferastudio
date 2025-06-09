-- Add preview flag to questions table
-- This allows admin to mark questions as preview questions for users

ALTER TABLE questions 
ADD COLUMN is_preview BOOLEAN DEFAULT false NOT NULL;

-- Create index for efficient querying of preview questions
CREATE INDEX idx_questions_is_preview ON questions(is_preview);

-- Create index for preview questions by category 
CREATE INDEX idx_questions_category_preview ON questions(category_id, is_preview);

-- Add comment to document the purpose
COMMENT ON COLUMN questions.is_preview IS 'Flag to indicate if this question should be shown in preview tests for users';