-- Add missing columns to questions table
ALTER TABLE questions 
ADD COLUMN difficulty TEXT DEFAULT 'medium',
ADD COLUMN points INTEGER DEFAULT 1,
ADD COLUMN explanation TEXT;

-- Add check constraint for difficulty
ALTER TABLE questions 
ADD CONSTRAINT check_difficulty 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add check constraint for points
ALTER TABLE questions 
ADD CONSTRAINT check_points 
CHECK (points > 0 AND points <= 10);