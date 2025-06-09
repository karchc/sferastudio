-- Add position columns to answer-related tables for proper ordering

-- Add position to answers table
ALTER TABLE answers ADD COLUMN position INTEGER DEFAULT 0;

-- Add position to match_items table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'match_items' AND column_name = 'position') THEN
        ALTER TABLE match_items ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add position to sequence_items table if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sequence_items' AND column_name = 'position') THEN
        ALTER TABLE sequence_items ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add position to drag_drop_items table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drag_drop_items' AND column_name = 'position') THEN
        ALTER TABLE drag_drop_items ADD COLUMN position INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add indexes for better performance on position-based queries
CREATE INDEX IF NOT EXISTS idx_answers_position ON answers(question_id, position);
CREATE INDEX IF NOT EXISTS idx_match_items_position ON match_items(question_id, position);
CREATE INDEX IF NOT EXISTS idx_sequence_items_position ON sequence_items(question_id, position);
CREATE INDEX IF NOT EXISTS idx_drag_drop_items_position ON drag_drop_items(question_id, position);