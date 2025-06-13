-- Create function to insert user answers with proper boolean handling
CREATE OR REPLACE FUNCTION insert_user_answer(
  p_test_session_id UUID,
  p_question_id UUID,
  p_time_spent INTEGER,
  p_is_correct BOOLEAN
) RETURNS UUID AS $$
DECLARE
  answer_id UUID;
BEGIN
  INSERT INTO user_answers (
    test_session_id,
    question_id,
    time_spent,
    is_correct
  ) VALUES (
    p_test_session_id,
    p_question_id,
    p_time_spent,
    p_is_correct
  ) RETURNING id INTO answer_id;
  
  RETURN answer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;