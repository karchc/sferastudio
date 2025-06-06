-- Add performance optimization indexes for test engine

-- Index for faster tests lookup by category
CREATE INDEX IF NOT EXISTS idx_tests_category_id_is_active ON tests(category_id, is_active);

-- Indexes for test questions and questions
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id_position ON test_questions(test_id, position);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_category_id_type ON questions(category_id, type);

-- Compound index for faster answer lookups
CREATE INDEX IF NOT EXISTS idx_answers_question_id_is_correct ON answers(question_id, is_correct);

-- Indexes for special question types
CREATE INDEX IF NOT EXISTS idx_match_items_question_id ON match_items(question_id);
CREATE INDEX IF NOT EXISTS idx_sequence_items_question_id_correct_position ON sequence_items(question_id, correct_position);
CREATE INDEX IF NOT EXISTS idx_drag_drop_items_question_id_target_zone ON drag_drop_items(question_id, target_zone);

-- Indexes for test sessions
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id_status ON test_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id_status ON test_sessions(test_id, status);

-- Indexes for user answers
CREATE INDEX IF NOT EXISTS idx_user_answers_test_session_id_question_id ON user_answers(test_session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_selected_answers_user_answer_id ON selected_answers(user_answer_id);