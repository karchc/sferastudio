-- Database functions for the Test Engine
-- This migration adds functions for:
-- 1. Automatic test scoring
-- 2. Test session management
-- 3. Statistics generation helpers

-- Function to check if a multiple-choice or single-choice answer is correct
CREATE OR REPLACE FUNCTION check_multiple_choice_answer(p_question_id UUID, p_selected_answer_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  all_correct_count INTEGER;
  selected_correct_count INTEGER;
  incorrect_selected_count INTEGER;
  question_type TEXT;
BEGIN
  -- Get the question type
  SELECT type INTO question_type FROM questions WHERE id = p_question_id;
  
  -- Count all correct answers for this question
  SELECT COUNT(*) INTO all_correct_count 
  FROM answers 
  WHERE question_id = p_question_id AND is_correct = true;
  
  -- Count selected answers that are correct
  SELECT COUNT(*) INTO selected_correct_count 
  FROM answers 
  WHERE id = ANY(p_selected_answer_ids) AND is_correct = true;
  
  -- Count selected answers that are incorrect
  SELECT COUNT(*) INTO incorrect_selected_count 
  FROM answers 
  WHERE id = ANY(p_selected_answer_ids) AND is_correct = false;
  
  -- For single-choice: one and only one answer should be selected and it should be correct
  IF question_type = 'single-choice' OR question_type = 'true-false' THEN
    RETURN array_length(p_selected_answer_ids, 1) = 1 AND selected_correct_count = 1;
  
  -- For multiple-choice: all correct answers must be selected and no incorrect ones
  ELSIF question_type = 'multiple-choice' THEN
    RETURN selected_correct_count = all_correct_count AND incorrect_selected_count = 0;
  
  ELSE
    RETURN false; -- Not a multiple/single choice question
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a matching question is answered correctly
CREATE OR REPLACE FUNCTION check_matching_answer(p_question_id UUID, p_user_answer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_items INTEGER;
  correct_matches INTEGER;
BEGIN
  -- Count total match items for this question
  SELECT COUNT(*) INTO total_items 
  FROM match_items 
  WHERE question_id = p_question_id;
  
  -- Count correct matches by comparing the user's selections with correct answers
  SELECT COUNT(*) INTO correct_matches
  FROM selected_match_items smi
  JOIN match_items mi ON smi.match_item_id = mi.id
  WHERE smi.user_answer_id = p_user_answer_id
  AND smi.selected_right_text = mi.right_text;
  
  -- All items must be matched correctly
  RETURN total_items = correct_matches;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a sequence question is answered correctly
-- CREATE OR REPLACE FUNCTION check_sequence_answer(p_question_id UUID, p_user_answer_id UUID)
-- RETURNS BOOLEAN AS $$
-- DECLARE
--   is_correct BOOLEAN := true;
-- BEGIN
--   -- Check if each item is in the correct position
--   FOR i IN (
--     SELECT si.id, si.correct_position, usa.selected_position
--     FROM sequence_items si
--     LEFT JOIN user_sequence_answers usa ON usa.sequence_item_id = si.id AND usa.user_answer_id = p_user_answer_id
--     WHERE si.question_id = p_question_id
--   ) LOOP
--     IF i.correct_position != i.selected_position THEN
--       is_correct := false;
--       EXIT;
--     END IF;
--   END LOOP;
  
--   RETURN is_correct;
-- END;
-- $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION check_sequence_answer(p_question_id UUID, p_user_answer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_correct BOOLEAN := true;
  rec RECORD;  -- Declare a record variable for the loop
BEGIN
  -- Check if each item is in the correct position
  FOR rec IN (
    SELECT si.id, si.correct_position, usa.selected_position
    FROM sequence_items si
    LEFT JOIN user_sequence_answers usa ON usa.sequence_item_id = si.id AND usa.user_answer_id = p_user_answer_id
    WHERE si.question_id = p_question_id
  ) LOOP
    IF rec.correct_position != rec.selected_position THEN
      is_correct := false;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN is_correct;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a drag and drop question is answered correctly
CREATE OR REPLACE FUNCTION check_drag_drop_answer(p_question_id UUID, p_user_answer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_items INTEGER;
  correct_placements INTEGER;
BEGIN
  -- Count total drag-drop items for this question
  SELECT COUNT(*) INTO total_items 
  FROM drag_drop_items 
  WHERE question_id = p_question_id;
  
  -- Count correct placements
  SELECT COUNT(*) INTO correct_placements
  FROM user_drag_drop_answers udda
  JOIN drag_drop_items ddi ON udda.drag_drop_item_id = ddi.id
  WHERE udda.user_answer_id = p_user_answer_id
  AND udda.selected_zone = ddi.target_zone;
  
  -- All items must be placed in the correct zones
  RETURN total_items = correct_placements;
END;
$$ LANGUAGE plpgsql;

-- Main function to evaluate a user's answer
CREATE OR REPLACE FUNCTION evaluate_user_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_type TEXT;
  selected_answer_ids UUID[];
BEGIN
  -- Get the question type
  SELECT type INTO question_type 
  FROM questions 
  WHERE id = NEW.question_id;
  
  -- Initialize with NULL (unanswered)
  NEW.is_correct := NULL;
  
  -- Different evaluation based on question type
  IF question_type IN ('multiple-choice', 'single-choice', 'true-false') THEN
    -- Get selected answer IDs
    SELECT array_agg(answer_id) INTO selected_answer_ids
    FROM selected_answers
    WHERE user_answer_id = NEW.id;
    
    -- Only evaluate if answers were selected
    IF selected_answer_ids IS NOT NULL THEN
      NEW.is_correct := check_multiple_choice_answer(NEW.question_id, selected_answer_ids);
    END IF;
    
  ELSIF question_type = 'matching' THEN
    -- Check if any match items were selected
    IF EXISTS (SELECT 1 FROM selected_match_items WHERE user_answer_id = NEW.id) THEN
      NEW.is_correct := check_matching_answer(NEW.question_id, NEW.id);
    END IF;
    
  ELSIF question_type = 'sequence' THEN
    -- Check if any sequence items were ordered
    IF EXISTS (SELECT 1 FROM user_sequence_answers WHERE user_answer_id = NEW.id) THEN
      NEW.is_correct := check_sequence_answer(NEW.question_id, NEW.id);
    END IF;
    
  ELSIF question_type = 'drag-drop' THEN
    -- Check if any drag-drop items were placed
    IF EXISTS (SELECT 1 FROM user_drag_drop_answers WHERE user_answer_id = NEW.id) THEN
      NEW.is_correct := check_drag_drop_answer(NEW.question_id, NEW.id);
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically evaluate answers when inserted or updated
CREATE TRIGGER evaluate_answer_trigger
BEFORE INSERT OR UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION evaluate_user_answer();

-- Function to calculate and update test session score
CREATE OR REPLACE FUNCTION update_test_session_score()
RETURNS TRIGGER AS $$
DECLARE
  total_questions INTEGER;
  correct_answers INTEGER;
  calculated_score INTEGER;
BEGIN
  -- Find total questions in the test
  SELECT COUNT(*) INTO total_questions
  FROM test_questions
  WHERE test_id = (SELECT test_id FROM test_sessions WHERE id = NEW.test_session_id);
  
  -- Find correctly answered questions
  SELECT COUNT(*) INTO correct_answers
  FROM user_answers
  WHERE test_session_id = NEW.test_session_id AND is_correct = true;
  
  -- Calculate percentage score (rounded to nearest integer)
  IF total_questions > 0 THEN
    calculated_score := ROUND((correct_answers::FLOAT / total_questions::FLOAT) * 100);
  ELSE
    calculated_score := 0;
  END IF;
  
  -- Update the test_session score
  UPDATE test_sessions
  SET score = calculated_score,
      updated_at = NOW()
  WHERE id = NEW.test_session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate test score when answers change
CREATE TRIGGER update_score_trigger
AFTER INSERT OR UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION update_test_session_score();

-- Function to update the user's answer time spent
CREATE OR REPLACE FUNCTION update_question_time_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate time spent if not provided
  IF NEW.time_spent IS NULL THEN
    -- Logic to calculate time spent if needed
    -- For now, we just set it to 0 if null
    NEW.time_spent := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track time spent on questions
CREATE TRIGGER track_question_time_trigger
BEFORE INSERT OR UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION update_question_time_spent();

-- Function to manage test session status
CREATE OR REPLACE FUNCTION manage_test_session_status()
RETURNS TRIGGER AS $$
DECLARE
  total_questions INTEGER;
  answered_questions INTEGER;
  test_time_limit INTEGER;
  elapsed_time INTEGER;
BEGIN
  -- Get test time limit
  SELECT time_limit INTO test_time_limit
  FROM tests
  WHERE id = NEW.test_id;
  
  -- Calculate elapsed time in seconds
  IF NEW.start_time IS NOT NULL AND NEW.end_time IS NULL THEN
    elapsed_time := EXTRACT(EPOCH FROM (NOW() - NEW.start_time))::INTEGER;
  ELSIF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    elapsed_time := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  ELSE
    elapsed_time := 0;
  END IF;

  -- Auto-expire tests that have exceeded their time limit
  IF NEW.status = 'in_progress' AND elapsed_time > test_time_limit THEN
    NEW.status := 'expired';
    NEW.end_time := NEW.start_time + (test_time_limit * INTERVAL '1 second');
    NEW.time_spent := test_time_limit;
  END IF;
  
  -- Count total questions in the test
  SELECT COUNT(*) INTO total_questions
  FROM test_questions
  WHERE test_id = NEW.test_id;
  
  -- Count answered questions
  SELECT COUNT(*) INTO answered_questions
  FROM user_answers
  WHERE test_session_id = NEW.id AND is_correct IS NOT NULL;
  
  -- Auto-complete test if all questions answered or explicitly completed
  IF NEW.status = 'in_progress' AND 
     (answered_questions = total_questions OR TG_OP = 'UPDATE' AND OLD.status = 'in_progress' AND NEW.status = 'completed') THEN
    
    -- If not explicitly completed, set status to completed
    IF NEW.status != 'completed' THEN
      NEW.status := 'completed';
    END IF;
    
    -- If end_time not set, set it to now
    IF NEW.end_time IS NULL THEN
      NEW.end_time := NOW();
    END IF;
    
    -- Update time_spent
    NEW.time_spent := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to manage test session status
CREATE TRIGGER manage_session_status_trigger
BEFORE INSERT OR UPDATE ON test_sessions
FOR EACH ROW
EXECUTE FUNCTION manage_test_session_status();

-- Function to calculate user statistics for dashboard
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE (
  tests_taken INTEGER,
  tests_completed INTEGER,
  tests_in_progress INTEGER,
  avg_score NUMERIC,
  total_time_spent INTEGER,
  strongest_category TEXT,
  weakest_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT
      COUNT(*) AS total_tests,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tests,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tests,
      AVG(CASE WHEN status = 'completed' THEN score ELSE NULL END) AS average_score,
      SUM(time_spent) AS total_time
    FROM test_sessions
    WHERE user_id = p_user_id
  ),
  category_performance AS (
    SELECT
      c.name AS category_name,
      AVG(CASE WHEN ua.is_correct THEN 100 ELSE 0 END) AS category_score
    FROM user_answers ua
    JOIN test_sessions ts ON ua.test_session_id = ts.id
    JOIN questions q ON ua.question_id = q.id
    JOIN categories c ON q.category_id = c.id
    WHERE ts.user_id = p_user_id AND ua.is_correct IS NOT NULL
    GROUP BY c.name
  ),
  ranked_categories AS (
    SELECT
      category_name,
      category_score,
      RANK() OVER (ORDER BY category_score DESC) AS best_rank,
      RANK() OVER (ORDER BY category_score ASC) AS worst_rank
    FROM category_performance
  )
  SELECT
    us.total_tests,
    us.completed_tests,
    us.in_progress_tests,
    ROUND(us.average_score, 2),
    us.total_time,
    (SELECT category_name FROM ranked_categories WHERE best_rank = 1 LIMIT 1),
    (SELECT category_name FROM ranked_categories WHERE worst_rank = 1 LIMIT 1)
  FROM user_stats us;
END;
$$ LANGUAGE plpgsql;

-- Function to get a user's recent test history
CREATE OR REPLACE FUNCTION get_user_test_history(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  test_id UUID,
  test_title TEXT,
  category_name TEXT,
  status TEXT,
  score INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS test_id,
    t.title AS test_title,
    c.name AS category_name,
    ts.status,
    ts.score,
    ts.start_time,
    ts.end_time,
    ts.time_spent
  FROM test_sessions ts
  JOIN tests t ON ts.test_id = t.id
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE ts.user_id = p_user_id
  ORDER BY ts.start_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get a user's in-progress tests
CREATE OR REPLACE FUNCTION get_user_in_progress_tests(p_user_id UUID)
RETURNS TABLE (
  test_session_id UUID,
  test_id UUID,
  test_title TEXT,
  category_name TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER,
  questions_answered INTEGER,
  total_questions INTEGER,
  time_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ts.id AS test_session_id,
    t.id AS test_id,
    t.title AS test_title,
    c.name AS category_name,
    ts.start_time,
    EXTRACT(EPOCH FROM (NOW() - ts.start_time))::INTEGER AS time_spent,
    COUNT(ua.id) AS questions_answered,
    COUNT(tq.id) AS total_questions,
    GREATEST(0, t.time_limit - EXTRACT(EPOCH FROM (NOW() - ts.start_time))::INTEGER) AS time_remaining
  FROM test_sessions ts
  JOIN tests t ON ts.test_id = t.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN test_questions tq ON tq.test_id = t.id
  LEFT JOIN user_answers ua ON ua.test_session_id = ts.id AND ua.is_correct IS NOT NULL
  WHERE ts.user_id = p_user_id AND ts.status = 'in_progress'
  GROUP BY ts.id, t.id, c.name
  ORDER BY ts.start_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get category-specific performance for a user
CREATE OR REPLACE FUNCTION get_user_category_performance(p_user_id UUID)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  tests_taken INTEGER,
  avg_score NUMERIC,
  correct_answers INTEGER,
  total_questions INTEGER,
  accuracy_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    COUNT(DISTINCT ts.id) AS tests_taken,
    AVG(ts.score) AS avg_score,
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_answers,
    COUNT(ua.id) AS total_questions,
    CASE 
      WHEN COUNT(ua.id) > 0 THEN 
        ROUND((SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(ua.id)) * 100, 2)
      ELSE 0
    END AS accuracy_percentage
  FROM categories c
  LEFT JOIN questions q ON q.category_id = c.id
  LEFT JOIN user_answers ua ON ua.question_id = q.id
  LEFT JOIN test_sessions ts ON ua.test_session_id = ts.id AND ts.user_id = p_user_id AND ts.status = 'completed'
  GROUP BY c.id, c.name
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;