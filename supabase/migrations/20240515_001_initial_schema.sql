-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table linked to auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories/Subjects for tests
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test definitions
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER NOT NULL, -- in seconds
  category_id UUID REFERENCES categories(id),
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question bank with various question types
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple-choice', 'single-choice', 'true-false', 'matching', 'sequence', 'drag-drop')),
  media_url TEXT, -- For images, diagrams, etc.
  category_id UUID REFERENCES categories(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multiple choice and single choice question answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matching question items
CREATE TABLE match_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  left_text TEXT NOT NULL,
  right_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequence question items
CREATE TABLE sequence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  correct_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drag and drop question items
CREATE TABLE drag_drop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  target_zone TEXT NOT NULL,  -- Identifier for the correct drop zone
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for tests and questions
CREATE TABLE test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- for ordering questions within a test
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(test_id, question_id)
);

-- Test session tracking
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')),
  score INTEGER,
  time_spent INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User answers to questions
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  time_spent INTEGER, -- in seconds
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Selected answer choices for multiple choice questions
CREATE TABLE selected_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_answer_id UUID NOT NULL REFERENCES user_answers(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES answers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Selected matches for matching questions
CREATE TABLE selected_match_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_answer_id UUID NOT NULL REFERENCES user_answers(id) ON DELETE CASCADE,
  match_item_id UUID NOT NULL REFERENCES match_items(id),
  selected_right_text TEXT NOT NULL, -- what the user selected as the match
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sequence answers
CREATE TABLE user_sequence_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_answer_id UUID NOT NULL REFERENCES user_answers(id) ON DELETE CASCADE,
  sequence_item_id UUID NOT NULL REFERENCES sequence_items(id),
  selected_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User drag and drop answers
CREATE TABLE user_drag_drop_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_answer_id UUID NOT NULL REFERENCES user_answers(id) ON DELETE CASCADE,
  drag_drop_item_id UUID NOT NULL REFERENCES drag_drop_items(id),
  selected_zone TEXT NOT NULL, -- The zone where the user dropped the item
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX idx_test_sessions_test_id ON test_sessions(test_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_tests_category_id ON tests(category_id);
CREATE INDEX idx_user_answers_test_session_id ON user_answers(test_session_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_match_items_question_id ON match_items(question_id);
CREATE INDEX idx_sequence_items_question_id ON sequence_items(question_id);
CREATE INDEX idx_drag_drop_items_question_id ON drag_drop_items(question_id);
CREATE INDEX idx_selected_answers_user_answer_id ON selected_answers(user_answer_id);
CREATE INDEX idx_selected_match_items_user_answer_id ON selected_match_items(user_answer_id);
CREATE INDEX idx_user_sequence_answers_user_answer_id ON user_sequence_answers(user_answer_id);
CREATE INDEX idx_user_drag_drop_answers_user_answer_id ON user_drag_drop_answers(user_answer_id);