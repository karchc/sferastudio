-- Seed data for the Test Engine
-- This migration adds sample data for testing the application

-- Add categories
INSERT INTO categories (id, name, description) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Programming', 'Computer programming and software development topics'),
  ('22222222-2222-2222-2222-222222222222', 'Mathematics', 'Math concepts from basic to advanced'),
  ('33333333-3333-3333-3333-333333333333', 'Science', 'General science topics including physics, chemistry, and biology'),
  ('44444444-4444-4444-4444-444444444444', 'History', 'Historical events and figures'),
  ('55555555-5555-5555-5555-555555555555', 'Languages', 'Foreign language learning and linguistics');

-- Add sample admin user (this would be replaced with actual admin users)
-- Note: In a real deployment, you would create users through Supabase Auth and not directly
-- This is just for demonstration purposes and local development
INSERT INTO profiles (id, email, full_name, is_admin) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@example.com', 'Admin User', true);

-- Add tests
INSERT INTO tests (id, title, description, time_limit, category_id, created_by, is_active) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'JavaScript Basics', 'Test your knowledge of basic JavaScript concepts', 900, '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Advanced Algebra', 'Test covering advanced algebra concepts', 1200, '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Basic Chemistry', 'Fundamentals of chemistry', 1500, '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- Add questions with different types

-- Multiple choice questions for JavaScript Basics test
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q1111111-1111-1111-1111-111111111111', 'Which of the following is NOT a JavaScript data type?', 'multiple-choice', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('q2222222-2222-2222-2222-222222222222', 'Which of these methods modifies the original array?', 'multiple-choice', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add answers for the multiple choice questions
INSERT INTO answers (question_id, text, is_correct) VALUES
  ('q1111111-1111-1111-1111-111111111111', 'String', false),
  ('q1111111-1111-1111-1111-111111111111', 'Number', false),
  ('q1111111-1111-1111-1111-111111111111', 'Boolean', false),
  ('q1111111-1111-1111-1111-111111111111', 'Character', true),
  
  ('q2222222-2222-2222-2222-222222222222', 'map()', false),
  ('q2222222-2222-2222-2222-222222222222', 'filter()', false),
  ('q2222222-2222-2222-2222-222222222222', 'push()', true),
  ('q2222222-2222-2222-2222-222222222222', 'reduce()', false);

-- Single choice questions
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q3333333-3333-3333-3333-333333333333', 'What is the output of console.log(typeof null) in JavaScript?', 'single-choice', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add answers for the single choice question
INSERT INTO answers (question_id, text, is_correct) VALUES
  ('q3333333-3333-3333-3333-333333333333', 'null', false),
  ('q3333333-3333-3333-3333-333333333333', 'undefined', false),
  ('q3333333-3333-3333-3333-333333333333', 'object', true),
  ('q3333333-3333-3333-3333-333333333333', 'string', false);

-- True/False question
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q4444444-4444-4444-4444-444444444444', 'JavaScript is a statically typed language.', 'true-false', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add answers for the true/false question
INSERT INTO answers (question_id, text, is_correct) VALUES
  ('q4444444-4444-4444-4444-444444444444', 'True', false),
  ('q4444444-4444-4444-4444-444444444444', 'False', true);

-- Matching question
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q5555555-5555-5555-5555-555555555555', 'Match the JavaScript method with its purpose:', 'matching', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add match items
INSERT INTO match_items (question_id, left_text, right_text) VALUES
  ('q5555555-5555-5555-5555-555555555555', 'push()', 'Add elements to the end of an array'),
  ('q5555555-5555-5555-5555-555555555555', 'pop()', 'Remove the last element from an array'),
  ('q5555555-5555-5555-5555-555555555555', 'shift()', 'Remove the first element from an array'),
  ('q5555555-5555-5555-5555-555555555555', 'unshift()', 'Add elements to the beginning of an array');

-- Sequence question
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q6666666-6666-6666-6666-666666666666', 'Arrange the following steps in the correct order to declare and use a JavaScript function:', 'sequence', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add sequence items
INSERT INTO sequence_items (question_id, text, correct_position) VALUES
  ('q6666666-6666-6666-6666-666666666666', 'Write the function keyword', 1),
  ('q6666666-6666-6666-6666-666666666666', 'Define the function name', 2),
  ('q6666666-6666-6666-6666-666666666666', 'Define parameters in parentheses', 3),
  ('q6666666-6666-6666-6666-666666666666', 'Open curly braces', 4),
  ('q6666666-6666-6666-6666-666666666666', 'Write the function body', 5),
  ('q6666666-6666-6666-6666-666666666666', 'Return a value if needed', 6),
  ('q6666666-6666-6666-6666-666666666666', 'Close curly braces', 7),
  ('q6666666-6666-6666-6666-666666666666', 'Call the function with arguments', 8);

-- Drag and drop question
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q7777777-7777-7777-7777-777777777777', 'Categorize the following JavaScript features into their correct categories:', 'drag-drop', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add drag and drop items
INSERT INTO drag_drop_items (question_id, content, target_zone) VALUES
  ('q7777777-7777-7777-7777-777777777777', 'let', 'ES6_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'const', 'ES6_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'var', 'Legacy_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'function', 'Legacy_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'arrow functions', 'ES6_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'template literals', 'ES6_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'XMLHttpRequest', 'Legacy_Features'),
  ('q7777777-7777-7777-7777-777777777777', 'fetch', 'ES6_Features');

-- Add questions to the JavaScript Basics test
INSERT INTO test_questions (test_id, question_id, position) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q1111111-1111-1111-1111-111111111111', 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q2222222-2222-2222-2222-222222222222', 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q3333333-3333-3333-3333-333333333333', 3),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q4444444-4444-4444-4444-444444444444', 4),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q5555555-5555-5555-5555-555555555555', 5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q6666666-6666-6666-6666-666666666666', 6),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'q7777777-7777-7777-7777-777777777777', 7);

-- Create questions for the Advanced Algebra test
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('q8888888-8888-8888-8888-888888888888', 'Which of the following is a quadratic equation?', 'single-choice', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('q9999999-9999-9999-9999-999999999999', 'Select all properties that apply to polynomial functions:', 'multiple-choice', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('qaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'The roots of the equation x² - 5x + 6 = 0 are 2 and 3.', 'true-false', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add answers for the algebra questions
INSERT INTO answers (question_id, text, is_correct) VALUES
  ('q8888888-8888-8888-8888-888888888888', 'y = 2x + 3', false),
  ('q8888888-8888-8888-8888-888888888888', 'y = x² + 2x + 1', true),
  ('q8888888-8888-8888-8888-888888888888', 'y = 3x³ + 2x² + x + 1', false),
  ('q8888888-8888-8888-8888-888888888888', 'y = 4^x', false),
  
  ('q9999999-9999-9999-9999-999999999999', 'Continuous over their entire domain', true),
  ('q9999999-9999-9999-9999-999999999999', 'Can have at most n roots for a polynomial of degree n', true),
  ('q9999999-9999-9999-9999-999999999999', 'Always have at least one real root', false),
  ('q9999999-9999-9999-9999-999999999999', 'The end behavior depends on the leading term', true),
  
  ('qaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'True', true),
  ('qaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'False', false);

-- Add questions to the Advanced Algebra test
INSERT INTO test_questions (test_id, question_id, position) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'q8888888-8888-8888-8888-888888888888', 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'q9999999-9999-9999-9999-999999999999', 2),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'qaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3);

-- Create questions for the Basic Chemistry test
INSERT INTO questions (id, text, type, category_id, created_by) VALUES
  ('qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Match the element with its symbol:', 'matching', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('qccccccc-cccc-cccc-cccc-cccccccccccc', 'Order the following elements by increasing atomic number:', 'sequence', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Add match items for chemistry
INSERT INTO match_items (question_id, left_text, right_text) VALUES
  ('qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Hydrogen', 'H'),
  ('qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Oxygen', 'O'),
  ('qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Carbon', 'C'),
  ('qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Nitrogen', 'N'),
  ('qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sodium', 'Na');

-- Add sequence items for chemistry
INSERT INTO sequence_items (question_id, text, correct_position) VALUES
  ('qccccccc-cccc-cccc-cccc-cccccccccccc', 'Hydrogen', 1),
  ('qccccccc-cccc-cccc-cccc-cccccccccccc', 'Helium', 2),
  ('qccccccc-cccc-cccc-cccc-cccccccccccc', 'Lithium', 3),
  ('qccccccc-cccc-cccc-cccc-cccccccccccc', 'Beryllium', 4),
  ('qccccccc-cccc-cccc-cccc-cccccccccccc', 'Boron', 5);

-- Add questions to the Basic Chemistry test
INSERT INTO test_questions (test_id, question_id, position) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'qbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'qccccccc-cccc-cccc-cccc-cccccccccccc', 2);

-- Add a sample user for testing (this would normally be created through auth)
INSERT INTO profiles (id, email, full_name, is_admin) VALUES 
  ('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 'user@example.com', 'Test User', false);

-- Add a sample test session
INSERT INTO test_sessions (id, test_id, user_id, start_time, end_time, status, score, time_spent) VALUES
  ('ssssssss-ssss-ssss-ssss-ssssssssssss', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', 
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'completed', 85, 3600);

-- Add some sample user answers
INSERT INTO user_answers (id, test_session_id, question_id, time_spent, is_correct) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'q1111111-1111-1111-1111-111111111111', 60, true),
  ('a2222222-2222-2222-2222-222222222222', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'q2222222-2222-2222-2222-222222222222', 45, true),
  ('a3333333-3333-3333-3333-333333333333', 'ssssssss-ssss-ssss-ssss-ssssssssssss', 'q3333333-3333-3333-3333-333333333333', 30, false);

-- Add selected answers for the multiple/single choice questions
INSERT INTO selected_answers (user_answer_id, answer_id) 
SELECT 'a1111111-1111-1111-1111-111111111111', id FROM answers 
WHERE question_id = 'q1111111-1111-1111-1111-111111111111' AND text = 'Character';

INSERT INTO selected_answers (user_answer_id, answer_id) 
SELECT 'a2222222-2222-2222-2222-222222222222', id FROM answers 
WHERE question_id = 'q2222222-2222-2222-2222-222222222222' AND text = 'push()';

INSERT INTO selected_answers (user_answer_id, answer_id) 
SELECT 'a3333333-3333-3333-3333-333333333333', id FROM answers 
WHERE question_id = 'q3333333-3333-3333-3333-333333333333' AND text = 'null';