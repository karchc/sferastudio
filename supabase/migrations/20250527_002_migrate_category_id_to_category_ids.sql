-- Migrate from single category_id to category_ids array and drop redundant column
-- This completes the migration to using only the category_ids array field

-- Step 1: Migrate any data from category_id to category_ids where category_ids is empty
UPDATE tests 
SET category_ids = ARRAY[category_id]
WHERE category_id IS NOT NULL 
  AND (category_ids IS NULL OR category_ids = '{}');

-- Step 2: Drop the redundant category_id column
ALTER TABLE tests DROP COLUMN IF EXISTS category_id;

-- Step 3: Add a comment explaining the field
COMMENT ON COLUMN tests.category_ids IS 'Array of category UUIDs - supports multiple categories per test for better flexibility';