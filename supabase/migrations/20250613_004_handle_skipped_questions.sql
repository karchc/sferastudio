-- Update functions to handle skipped questions
-- Skipped questions should not count towards the score calculation

DROP TRIGGER IF EXISTS update_score_trigger ON user_answers;
DROP FUNCTION IF EXISTS update_test_session_score();

-- Update the function to exclude skipped questions from scoring
CREATE OR REPLACE FUNCTION update_test_session_score()
RETURNS TRIGGER AS $$
DECLARE
  total_questions INTEGER;
  correct_answers INTEGER;
  answered_questions INTEGER;
  calculated_score INTEGER;
BEGIN
  -- Find total questions in the test
  SELECT COUNT(*) INTO total_questions
  FROM test_questions
  WHERE test_id = (SELECT test_id FROM test_sessions WHERE id = NEW.test_session_id);
  
  -- Count only answered questions (excluding skipped)
  SELECT COUNT(*) INTO answered_questions
  FROM user_answers
  WHERE test_session_id = NEW.test_session_id 
    AND is_correct IN ('true', 'false'); -- Exclude 'skipped' and NULL
  
  -- Find correctly answered questions
  SELECT COUNT(*) INTO correct_answers
  FROM user_answers
  WHERE test_session_id = NEW.test_session_id 
    AND is_correct = 'true';
  
  -- Calculate percentage score based on total questions (not just answered)
  -- This means skipped questions count as wrong for the final score
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

-- Recreate the trigger
CREATE TRIGGER update_score_trigger
AFTER INSERT OR UPDATE ON user_answers
FOR EACH ROW
EXECUTE FUNCTION update_test_session_score();

-- Update manage_test_session_status to count only answered questions
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
  
  -- Count answered questions (excluding skipped)
  SELECT COUNT(*) INTO answered_questions
  FROM user_answers
  WHERE test_session_id = NEW.id 
    AND is_correct IN ('true', 'false', 'skipped'); -- All non-NULL values
  
  -- Auto-complete test if all questions have been processed (answered or skipped)
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

-- Update get_user_statistics to handle skipped questions
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
      -- Calculate score based only on answered questions
      AVG(CASE 
        WHEN ua.is_correct = 'true' THEN 100 
        WHEN ua.is_correct = 'false' THEN 0
        ELSE NULL -- Exclude skipped questions from average
      END) AS category_score
    FROM user_answers ua
    JOIN test_sessions ts ON ua.test_session_id = ts.id
    JOIN questions q ON ua.question_id = q.id
    JOIN categories c ON q.category_id = c.id
    WHERE ts.user_id = p_user_id 
      AND ua.is_correct IN ('true', 'false') -- Only answered questions
    GROUP BY c.name
  ),
  ranked_categories AS (
    SELECT
      category_name,
      category_score,
      RANK() OVER (ORDER BY category_score DESC) AS best_rank,
      RANK() OVER (ORDER BY category_score ASC) AS worst_rank
    FROM category_performance
    WHERE category_score IS NOT NULL
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

-- Update get_user_category_performance to handle skipped questions
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
    -- Count only answered questions for accuracy calculation
    SUM(CASE WHEN ua.is_correct IN ('true', 'false') THEN 1 ELSE 0 END) AS total_questions,
    CASE 
      WHEN SUM(CASE WHEN ua.is_correct IN ('true', 'false') THEN 1 ELSE 0 END) > 0 THEN 
        ROUND((SUM(CASE WHEN ua.is_correct = 'true' THEN 1 ELSE 0 END)::NUMERIC / 
               SUM(CASE WHEN ua.is_correct IN ('true', 'false') THEN 1 ELSE 0 END)) * 100, 2)
      ELSE 0
    END AS accuracy_percentage
  FROM categories c
  LEFT JOIN questions q ON q.category_id = c.id
  LEFT JOIN user_answers ua ON ua.question_id = q.id
  LEFT JOIN test_sessions ts ON ua.test_session_id = ts.id AND ts.user_id = p_user_id AND ts.status = 'completed'
  WHERE ua.is_correct IS NOT NULL -- Exclude NULL values
  GROUP BY c.id, c.name
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql;