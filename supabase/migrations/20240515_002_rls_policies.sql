-- Row Level Security (RLS) Policies
-- This migration sets up RLS policies for the tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drag_drop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_match_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sequence_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drag_drop_answers ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: 
-- - User can read any profile
-- - User can update only their own profile
-- - Admins can do anything with profiles
CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_admin_policy ON profiles FOR INSERT TO authenticated WITH CHECK (is_admin() OR id = auth.uid());
CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (is_admin() OR id = auth.uid()) WITH CHECK (is_admin() OR id = auth.uid());
CREATE POLICY profiles_delete_admin_policy ON profiles FOR DELETE USING (is_admin());

-- Categories:
-- - Anyone can read categories
-- - Only admins can create/update/delete categories
CREATE POLICY categories_select_policy ON categories FOR SELECT USING (true);
CREATE POLICY categories_insert_admin_policy ON categories FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY categories_update_admin_policy ON categories FOR UPDATE USING (is_admin());
CREATE POLICY categories_delete_admin_policy ON categories FOR DELETE USING (is_admin());

-- Tests:
-- - Anyone can read active tests
-- - Only admins can create/update/delete tests
CREATE POLICY tests_select_policy ON tests FOR SELECT USING (is_active OR created_by = auth.uid() OR is_admin());
CREATE POLICY tests_insert_admin_policy ON tests FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY tests_update_admin_policy ON tests FOR UPDATE USING (is_admin());
CREATE POLICY tests_delete_admin_policy ON tests FOR DELETE USING (is_admin());

-- Questions:
-- - Anyone can read questions
-- - Only admins can create/update/delete questions
CREATE POLICY questions_select_policy ON questions FOR SELECT USING (true);
CREATE POLICY questions_insert_admin_policy ON questions FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY questions_update_admin_policy ON questions FOR UPDATE USING (is_admin());
CREATE POLICY questions_delete_admin_policy ON questions FOR DELETE USING (is_admin());

-- For most question detail tables, apply the same policies:
-- - Anyone can read
-- - Only admins can modify

-- Answers for questions
CREATE POLICY answers_select_policy ON answers FOR SELECT USING (true);
CREATE POLICY answers_insert_admin_policy ON answers FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY answers_update_admin_policy ON answers FOR UPDATE USING (is_admin());
CREATE POLICY answers_delete_admin_policy ON answers FOR DELETE USING (is_admin());

-- Match items
CREATE POLICY match_items_select_policy ON match_items FOR SELECT USING (true);
CREATE POLICY match_items_insert_admin_policy ON match_items FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY match_items_update_admin_policy ON match_items FOR UPDATE USING (is_admin());
CREATE POLICY match_items_delete_admin_policy ON match_items FOR DELETE USING (is_admin());

-- Sequence items
CREATE POLICY sequence_items_select_policy ON sequence_items FOR SELECT USING (true);
CREATE POLICY sequence_items_insert_admin_policy ON sequence_items FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY sequence_items_update_admin_policy ON sequence_items FOR UPDATE USING (is_admin());
CREATE POLICY sequence_items_delete_admin_policy ON sequence_items FOR DELETE USING (is_admin());

-- Drag and drop items
CREATE POLICY drag_drop_items_select_policy ON drag_drop_items FOR SELECT USING (true);
CREATE POLICY drag_drop_items_insert_admin_policy ON drag_drop_items FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY drag_drop_items_update_admin_policy ON drag_drop_items FOR UPDATE USING (is_admin());
CREATE POLICY drag_drop_items_delete_admin_policy ON drag_drop_items FOR DELETE USING (is_admin());

-- Test questions junction
CREATE POLICY test_questions_select_policy ON test_questions FOR SELECT USING (true);
CREATE POLICY test_questions_insert_admin_policy ON test_questions FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY test_questions_update_admin_policy ON test_questions FOR UPDATE USING (is_admin());
CREATE POLICY test_questions_delete_admin_policy ON test_questions FOR DELETE USING (is_admin());

-- Test sessions (user test attempts):
-- - Users can read their own test sessions
-- - Admins can read all test sessions
-- - Users can create and update their own test sessions
CREATE POLICY test_sessions_select_policy ON test_sessions FOR SELECT USING (is_admin() OR user_id = auth.uid());
CREATE POLICY test_sessions_insert_policy ON test_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY test_sessions_update_policy ON test_sessions FOR UPDATE USING (is_admin() OR user_id = auth.uid()) WITH CHECK (is_admin() OR user_id = auth.uid());
CREATE POLICY test_sessions_delete_admin_policy ON test_sessions FOR DELETE USING (is_admin());

-- User answers:
-- - Users can read their own answers
-- - Admins can read all answers
-- - Users can create and update their own answers
CREATE POLICY user_answers_select_join_policy ON user_answers FOR SELECT USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE test_sessions.id = user_answers.test_session_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_answers_insert_policy ON user_answers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE test_sessions.id = user_answers.test_session_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_answers_update_policy ON user_answers FOR UPDATE USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE test_sessions.id = user_answers.test_session_id 
    AND test_sessions.user_id = auth.uid()
  )
) WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE test_sessions.id = user_answers.test_session_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_answers_delete_admin_policy ON user_answers FOR DELETE USING (is_admin());

-- For user answer details (selected_answers, selected_match_items, etc.)
-- Apply similar policies to the user_answers table

-- Selected answers (multiple choice)
CREATE POLICY selected_answers_select_join_policy ON selected_answers FOR SELECT USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = selected_answers.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY selected_answers_insert_policy ON selected_answers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = selected_answers.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY selected_answers_delete_admin_policy ON selected_answers FOR DELETE USING (is_admin());

-- Selected match items
CREATE POLICY selected_match_items_select_join_policy ON selected_match_items FOR SELECT USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = selected_match_items.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY selected_match_items_insert_policy ON selected_match_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = selected_match_items.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY selected_match_items_delete_admin_policy ON selected_match_items FOR DELETE USING (is_admin());

-- User sequence answers
CREATE POLICY user_sequence_answers_select_join_policy ON user_sequence_answers FOR SELECT USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = user_sequence_answers.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_sequence_answers_insert_policy ON user_sequence_answers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = user_sequence_answers.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_sequence_answers_delete_admin_policy ON user_sequence_answers FOR DELETE USING (is_admin());

-- User drag and drop answers
CREATE POLICY user_drag_drop_answers_select_join_policy ON user_drag_drop_answers FOR SELECT USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = user_drag_drop_answers.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_drag_drop_answers_insert_policy ON user_drag_drop_answers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_answers 
    JOIN test_sessions ON test_sessions.id = user_answers.test_session_id
    WHERE user_answers.id = user_drag_drop_answers.user_answer_id 
    AND test_sessions.user_id = auth.uid()
  )
);
CREATE POLICY user_drag_drop_answers_delete_admin_policy ON user_drag_drop_answers FOR DELETE USING (is_admin());