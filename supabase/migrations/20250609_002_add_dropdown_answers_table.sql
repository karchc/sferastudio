-- Create dropdown_answers table for dropdown question type
CREATE TABLE dropdown_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_dropdown_answers_question_id ON dropdown_answers(question_id);
CREATE INDEX idx_dropdown_answers_position ON dropdown_answers(question_id, position);

-- Add RLS policy for dropdown_answers
ALTER TABLE dropdown_answers ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read dropdown_answers
CREATE POLICY "Users can view dropdown answers for questions" ON dropdown_answers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for admins to manage dropdown_answers
CREATE POLICY "Admins can manage dropdown answers" ON dropdown_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Note: updated_at trigger omitted as function doesn't exist