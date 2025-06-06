-- Drop the redundant test_categories table
-- The tests table already has a category_ids array field that serves the same purpose

-- First, drop any foreign key constraints
-- (The constraints should automatically be dropped when we drop the table)

-- Drop the test_categories table
DROP TABLE IF EXISTS test_categories;

-- Add a comment explaining why we dropped it
COMMENT ON COLUMN tests.category_ids IS 'Array of category IDs - replaces the test_categories junction table for better performance';