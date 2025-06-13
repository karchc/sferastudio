-- Add test_id column to categories table to make categories specific to tests
-- This ensures each category belongs to exactly one test

-- Step 1: Add the test_id column
ALTER TABLE categories 
ADD COLUMN test_id UUID REFERENCES tests(id) ON DELETE CASCADE;

-- Step 2: Add index for performance
CREATE INDEX idx_categories_test_id ON categories(test_id);

-- Step 3: Add comment explaining the relationship
COMMENT ON COLUMN categories.test_id IS 'Each category is now unique to one test, enabling better organization and isolation';

-- Step 4: Update RLS policies if needed (for future use)
-- Note: We'll add RLS policies in a future migration if needed