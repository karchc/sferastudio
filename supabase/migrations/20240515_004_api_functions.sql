-- API Functions for the Test Engine
-- This migration adds Supabase API functions that expose common operations
-- These functions are used by the frontend application via Supabase's RPC mechanism

-- Function to start a new test session
CREATE OR REPLACE FUNCTION start_test_session(p_test_id UUID)
RETURNS UUID AS $$
DECLARE
  new_session_id UUID;
BEGIN
  -- Verify that the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to start a test';
  END IF;
  
  -- Check if there's already an in-progress session for this user and test
  -- If yes, return that session instead of creating a new one
  SELECT id INTO new_session_id
  FROM test_sessions
  WHERE user_id = auth.uid() AND test_id = p_test_id AND status = 'in_progress';
  
  IF new_session_id IS NULL THEN
    -- Create a new test session
    INSERT INTO test_sessions (
      test_id,
      user_id,
      start_time,
      status
    ) VALUES (
      p_test_id,
      auth.uid(),
      NOW(),
      'in_progress'
    ) RETURNING id INTO new_session_id;
  END IF;
  
  RETURN new_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit an answer for a question in a test
CREATE OR REPLACE FUNCTION submit_answer(
  p_test_session_id UUID,
  p_question_id UUID,
  p_time_spent INTEGER,
  p_answer_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  question_type TEXT;
  user_answer_id UUID;
BEGIN
  -- Verify the session belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE id = p_test_session_id 
    AND user_id = auth.uid()
    AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Invalid test session or test not in progress';
  END IF;
  
  -- Get the question type
  SELECT type INTO question_type
  FROM questions
  WHERE id = p_question_id;
  
  -- Check if an answer already exists for this question in this session
  SELECT id INTO user_answer_id
  FROM user_answers
  WHERE test_session_id = p_test_session_id AND question_id = p_question_id;
  
  -- If there's an existing answer, delete it to replace with the new one
  IF user_answer_id IS NOT NULL THEN
    -- Delete related records first
    DELETE FROM selected_answers WHERE user_answer_id = user_answer_id;
    DELETE FROM selected_match_items WHERE user_answer_id = user_answer_id;
    DELETE FROM user_sequence_answers WHERE user_answer_id = user_answer_id;
    DELETE FROM user_drag_drop_answers WHERE user_answer_id = user_answer_id;
    
    -- Then delete the user answer
    DELETE FROM user_answers WHERE id = user_answer_id;
  END IF;
  
  -- Create a new user answer record
  INSERT INTO user_answers (
    test_session_id,
    question_id,
    time_spent
  ) VALUES (
    p_test_session_id,
    p_question_id,
    p_time_spent
  ) RETURNING id INTO user_answer_id;
  
  -- Process different answer types based on the question type
  IF question_type IN ('multiple-choice', 'single-choice', 'true-false') THEN
    -- For multiple/single choice, p_answer_data should be {"selected_answer_ids": [uuid1, uuid2, ...]}
    IF p_answer_data ? 'selected_answer_ids' AND jsonb_array_length(p_answer_data->'selected_answer_ids') > 0 THEN
      INSERT INTO selected_answers (user_answer_id, answer_id)
      SELECT user_answer_id, answer_id
      FROM jsonb_array_elements_text(p_answer_data->'selected_answer_ids') AS answer_id;
    END IF;
    
  ELSIF question_type = 'matching' THEN
    -- For matching, p_answer_data should be {"matches": [{"match_item_id": uuid, "selected_right_text": "text"}, ...]}
    IF p_answer_data ? 'matches' AND jsonb_array_length(p_answer_data->'matches') > 0 THEN
      INSERT INTO selected_match_items (user_answer_id, match_item_id, selected_right_text)
      SELECT 
        user_answer_id, 
        (match->>'match_item_id')::UUID,
        match->>'selected_right_text'
      FROM jsonb_array_elements(p_answer_data->'matches') AS match;
    END IF;
    
  ELSIF question_type = 'sequence' THEN
    -- For sequence, p_answer_data should be {"sequence": [{"sequence_item_id": uuid, "selected_position": 1}, ...]}
    IF p_answer_data ? 'sequence' AND jsonb_array_length(p_answer_data->'sequence') > 0 THEN
      INSERT INTO user_sequence_answers (user_answer_id, sequence_item_id, selected_position)
      SELECT 
        user_answer_id, 
        (seq->>'sequence_item_id')::UUID,
        (seq->>'selected_position')::INTEGER
      FROM jsonb_array_elements(p_answer_data->'sequence') AS seq;
    END IF;
    
  ELSIF question_type = 'drag-drop' THEN
    -- For drag-drop, p_answer_data should be {"placements": [{"drag_drop_item_id": uuid, "selected_zone": "zone"}, ...]}
    IF p_answer_data ? 'placements' AND jsonb_array_length(p_answer_data->'placements') > 0 THEN
      INSERT INTO user_drag_drop_answers (user_answer_id, drag_drop_item_id, selected_zone)
      SELECT 
        user_answer_id, 
        (place->>'drag_drop_item_id')::UUID,
        place->>'selected_zone'
      FROM jsonb_array_elements(p_answer_data->'placements') AS place;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a test
CREATE OR REPLACE FUNCTION complete_test(p_test_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  session_data RECORD;
BEGIN
  -- Verify the session belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE id = p_test_session_id 
    AND user_id = auth.uid()
    AND status = 'in_progress'
  ) THEN
    RAISE EXCEPTION 'Invalid test session or test not in progress';
  END IF;
  
  -- Mark the session as completed
  UPDATE test_sessions
  SET 
    status = 'completed',
    end_time = NOW(),
    updated_at = NOW()
  WHERE id = p_test_session_id
  RETURNING 
    id,
    test_id,
    score,
    EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER AS total_time_spent
  INTO session_data;
  
  -- Get the summary data for the test result
  SELECT jsonb_build_object(
    'test_session_id', session_data.id,
    'test_id', session_data.test_id,
    'score', session_data.score,
    'time_spent', session_data.total_time_spent,
    'correct_answers', (
      SELECT COUNT(*) 
      FROM user_answers 
      WHERE test_session_id = p_test_session_id AND is_correct = true
    ),
    'total_questions', (
      SELECT COUNT(*) 
      FROM test_questions 
      WHERE test_id = session_data.test_id
    ),
    'completed_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a test with its questions and answers
CREATE OR REPLACE FUNCTION get_test_with_questions(p_test_id UUID)
RETURNS JSONB AS $$
DECLARE
  test_data JSONB;
  questions_data JSONB;
BEGIN
  -- Get basic test information
  SELECT jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'description', t.description,
    'time_limit', t.time_limit,
    'category', jsonb_build_object(
      'id', c.id,
      'name', c.name
    )
  )
  FROM tests t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.id = p_test_id
  INTO test_data;
  
  -- Get all questions for this test
  SELECT jsonb_agg(q_data)
  FROM (
    SELECT 
      jsonb_build_object(
        'id', q.id,
        'text', q.text,
        'type', q.type,
        'media_url', q.media_url,
        'position', tq.position,
        'answers', CASE 
          WHEN q.type IN ('multiple-choice', 'single-choice', 'true-false') THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'id', a.id,
              'text', a.text
            ))
            FROM answers a
            WHERE a.question_id = q.id)
          WHEN q.type = 'matching' THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'id', mi.id,
              'left_text', mi.left_text,
              'right_text', mi.right_text
            ))
            FROM match_items mi
            WHERE mi.question_id = q.id)
          WHEN q.type = 'sequence' THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'id', si.id,
              'text', si.text
            ))
            FROM sequence_items si
            WHERE si.question_id = q.id
            ORDER BY RANDOM()) -- Randomize sequence for the test
          WHEN q.type = 'drag-drop' THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'id', ddi.id,
              'content', ddi.content,
              'target_zone', ddi.target_zone
            ))
            FROM drag_drop_items ddi
            WHERE ddi.question_id = q.id)
          ELSE NULL
        END
      ) AS q_data
    FROM test_questions tq
    JOIN questions q ON tq.question_id = q.id
    WHERE tq.test_id = p_test_id
    ORDER BY tq.position
  ) sub
  INTO questions_data;
  
  -- Combine and return full test data
  RETURN jsonb_build_object(
    'test', test_data,
    'questions', questions_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a test session with user answers
CREATE OR REPLACE FUNCTION get_test_session(p_test_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  session_data JSONB;
  user_answers_data JSONB;
BEGIN
  -- Verify the session belongs to the current user or user is admin
  IF NOT EXISTS (
    SELECT 1 FROM test_sessions 
    WHERE id = p_test_session_id 
    AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  ) THEN
    RAISE EXCEPTION 'Access denied: Invalid test session or insufficient permissions';
  END IF;
  
  -- Get session information
  SELECT jsonb_build_object(
    'id', ts.id,
    'test_id', ts.test_id,
    'test_title', t.title,
    'status', ts.status,
    'start_time', ts.start_time,
    'end_time', ts.end_time,
    'score', ts.score,
    'time_spent', ts.time_spent,
    'category', jsonb_build_object(
      'id', c.id,
      'name', c.name
    )
  )
  FROM test_sessions ts
  JOIN tests t ON ts.test_id = t.id
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE ts.id = p_test_session_id
  INTO session_data;
  
  -- Get all user answers for this session
  SELECT jsonb_agg(ua_data)
  FROM (
    SELECT 
      jsonb_build_object(
        'question_id', ua.question_id,
        'question_text', q.text,
        'question_type', q.type,
        'is_correct', ua.is_correct,
        'time_spent', ua.time_spent,
        'answers', CASE 
          WHEN q.type IN ('multiple-choice', 'single-choice', 'true-false') THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'answer_id', sa.answer_id,
              'answer_text', a.text,
              'is_correct', a.is_correct
            ))
            FROM selected_answers sa
            JOIN answers a ON sa.answer_id = a.id
            WHERE sa.user_answer_id = ua.id)
          WHEN q.type = 'matching' THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'match_item_id', smi.match_item_id,
              'left_text', mi.left_text,
              'correct_right_text', mi.right_text,
              'selected_right_text', smi.selected_right_text,
              'is_correct', (mi.right_text = smi.selected_right_text)
            ))
            FROM selected_match_items smi
            JOIN match_items mi ON smi.match_item_id = mi.id
            WHERE smi.user_answer_id = ua.id)
          WHEN q.type = 'sequence' THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'sequence_item_id', usa.sequence_item_id,
              'text', si.text,
              'correct_position', si.correct_position,
              'selected_position', usa.selected_position,
              'is_correct', (si.correct_position = usa.selected_position)
            ))
            FROM user_sequence_answers usa
            JOIN sequence_items si ON usa.sequence_item_id = si.id
            WHERE usa.user_answer_id = ua.id)
          WHEN q.type = 'drag-drop' THEN
            (SELECT jsonb_agg(jsonb_build_object(
              'drag_drop_item_id', udda.drag_drop_item_id,
              'content', ddi.content,
              'correct_zone', ddi.target_zone,
              'selected_zone', udda.selected_zone,
              'is_correct', (ddi.target_zone = udda.selected_zone)
            ))
            FROM user_drag_drop_answers udda
            JOIN drag_drop_items ddi ON udda.drag_drop_item_id = ddi.id
            WHERE udda.user_answer_id = ua.id)
          ELSE NULL
        END
      ) AS ua_data
    FROM user_answers ua
    JOIN questions q ON ua.question_id = q.id
    WHERE ua.test_session_id = p_test_session_id
    ORDER BY q.id
  ) sub
  INTO user_answers_data;
  
  -- Combine and return full session data
  RETURN jsonb_build_object(
    'session', session_data,
    'answers', user_answers_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard data for a user
CREATE OR REPLACE FUNCTION get_user_dashboard_data()
RETURNS JSONB AS $$
DECLARE
  user_id UUID := auth.uid();
  dashboard_data JSONB;
  stats RECORD;
  test_history JSONB;
  in_progress JSONB;
  category_performance JSONB;
BEGIN
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to access dashboard';
  END IF;
  
  -- Get user statistics
  SELECT * FROM get_user_statistics(user_id) INTO stats;
  
  -- Get test history
  SELECT jsonb_agg(h)
  FROM get_user_test_history(user_id, 5) h
  INTO test_history;
  
  -- Get in-progress tests
  SELECT jsonb_agg(ip)
  FROM get_user_in_progress_tests(user_id) ip
  INTO in_progress;
  
  -- Get category performance
  SELECT jsonb_agg(cp)
  FROM get_user_category_performance(user_id) cp
  INTO category_performance;
  
  -- Build the dashboard data
  dashboard_data := jsonb_build_object(
    'user_id', user_id,
    'statistics', jsonb_build_object(
      'tests_taken', stats.tests_taken,
      'tests_completed', stats.tests_completed,
      'tests_in_progress', stats.tests_in_progress,
      'avg_score', stats.avg_score,
      'total_time_spent', stats.total_time_spent,
      'strongest_category', stats.strongest_category,
      'weakest_category', stats.weakest_category
    ),
    'test_history', COALESCE(test_history, '[]'::jsonb),
    'in_progress_tests', COALESCE(in_progress, '[]'::jsonb),
    'category_performance', COALESCE(category_performance, '[]'::jsonb)
  );
  
  RETURN dashboard_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available tests for a user
CREATE OR REPLACE FUNCTION get_available_tests()
RETURNS JSONB AS $$
DECLARE
  available_tests JSONB;
BEGIN
  -- Get all active tests
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'description', t.description,
      'time_limit', t.time_limit,
      'category', jsonb_build_object(
        'id', c.id,
        'name', c.name
      ),
      'question_count', (
        SELECT COUNT(*) FROM test_questions WHERE test_id = t.id
      ),
      'already_started', (
        SELECT EXISTS (
          SELECT 1 FROM test_sessions 
          WHERE test_id = t.id AND user_id = auth.uid() AND status = 'in_progress'
        )
      ),
      'last_score', (
        SELECT score FROM test_sessions 
        WHERE test_id = t.id AND user_id = auth.uid() AND status = 'completed'
        ORDER BY end_time DESC LIMIT 1
      )
    )
  )
  FROM tests t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.is_active = true
  INTO available_tests;
  
  RETURN jsonb_build_object(
    'tests', COALESCE(available_tests, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all categories
CREATE OR REPLACE FUNCTION get_all_categories()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'categories', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'description', description
        )
      )
      FROM categories),
      '[]'::jsonb
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to get analytics
CREATE OR REPLACE FUNCTION admin_get_analytics()
RETURNS JSONB AS $$
DECLARE
  user_count INTEGER;
  test_count INTEGER;
  question_count INTEGER;
  test_sessions_count INTEGER;
  avg_score NUMERIC;
  category_stats JSONB;
  popular_tests JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get counts
  SELECT COUNT(*) INTO user_count FROM profiles;
  SELECT COUNT(*) INTO test_count FROM tests;
  SELECT COUNT(*) INTO question_count FROM questions;
  SELECT COUNT(*) INTO test_sessions_count FROM test_sessions;
  
  -- Get average score across all completed tests
  SELECT AVG(score) INTO avg_score FROM test_sessions WHERE status = 'completed';
  
  -- Get stats by category
  SELECT jsonb_agg(
    jsonb_build_object(
      'category_name', c.name,
      'test_count', COUNT(DISTINCT t.id),
      'question_count', COUNT(DISTINCT q.id),
      'avg_score', AVG(ts.score)
    )
  )
  FROM categories c
  LEFT JOIN tests t ON t.category_id = c.id
  LEFT JOIN test_questions tq ON tq.test_id = t.id
  LEFT JOIN questions q ON q.id = tq.question_id OR q.category_id = c.id
  LEFT JOIN test_sessions ts ON ts.test_id = t.id AND ts.status = 'completed'
  GROUP BY c.id, c.name
  INTO category_stats;
  
  -- Get most popular tests
  SELECT jsonb_agg(
    jsonb_build_object(
      'test_id', t.id,
      'test_title', t.title,
      'attempt_count', COUNT(ts.id),
      'avg_score', AVG(ts.score)
    )
  )
  FROM tests t
  JOIN test_sessions ts ON ts.test_id = t.id
  GROUP BY t.id, t.title
  ORDER BY COUNT(ts.id) DESC
  LIMIT 10
  INTO popular_tests;
  
  -- Return analytics data
  RETURN jsonb_build_object(
    'summary', jsonb_build_object(
      'user_count', user_count,
      'test_count', test_count,
      'question_count', question_count,
      'test_sessions_count', test_sessions_count,
      'avg_score', avg_score
    ),
    'category_stats', COALESCE(category_stats, '[]'::jsonb),
    'popular_tests', COALESCE(popular_tests, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;