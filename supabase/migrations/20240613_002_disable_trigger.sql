-- Disable the automatic evaluation trigger that's overriding our is_correct values
-- We're calculating is_correct in the application code instead

DROP TRIGGER IF EXISTS trigger_evaluate_user_answer ON user_answers;

-- Also remove the update score trigger since we're handling scoring in the application
DROP TRIGGER IF EXISTS trigger_update_test_session_score ON user_answers;