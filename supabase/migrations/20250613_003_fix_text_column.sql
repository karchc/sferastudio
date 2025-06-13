-- Drop the trigger and function that expects boolean values
-- since we've changed is_correct to text column

DROP TRIGGER IF EXISTS evaluate_answer_trigger ON user_answers;
DROP FUNCTION IF EXISTS evaluate_user_answer();

-- Drop the score update trigger that compares is_correct = true
DROP TRIGGER IF EXISTS update_score_trigger ON user_answers;
DROP FUNCTION IF EXISTS update_test_session_score();

-- Update any functions that reference is_correct as boolean to use text
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
  
  -- Find correctly answered questions (using text comparison)
  SELECT COUNT(*) INTO correct_answers
  FROM user_answers
  WHERE test_session_id = NEW.test_session_id AND is_correct = 'true';
  
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

-- Recreate the trigger to recalculate test score when answers change
CREATE TRIGGER update_score_trigger
AFTER INSERT OR UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION update_test_session_score();

-- Update other functions that use is_correct boolean comparisons

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
      AVG(CASE WHEN ua.is_correct = 'true' THEN 100 ELSE 0 END) AS category_score
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
    SUM(CASE WHEN ua.is_correct = 'true' THEN 1 ELSE 0 END) AS correct_answers,
    COUNT(ua.id) AS total_questions,
    CASE 
      WHEN COUNT(ua.id) > 0 THEN 
        ROUND((SUM(CASE WHEN ua.is_correct = 'true' THEN 1 ELSE 0 END)::NUMERIC / COUNT(ua.id)) * 100, 2)
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
  
  -- Count answered questions (using text comparison)
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