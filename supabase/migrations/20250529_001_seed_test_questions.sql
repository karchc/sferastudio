-- Migration to seed test questions
-- This creates a sample test with various question types

-- First, ensure we have a test category
INSERT INTO categories (id, name, description) 
VALUES ('cat-1', 'Programming', 'Programming and JavaScript questions')
ON CONFLICT (id) DO NOTHING;

-- Create a sample test
INSERT INTO tests (id, title, description, time_limit, category_ids, is_active, created_by)
VALUES (
  'test-js-fundamentals',
  'JavaScript Fundamentals Test',
  'Test your knowledge of JavaScript basics including data types, functions, and control structures.',
  1800, -- 30 minutes
  ARRAY['cat-1'],
  true,
  'system'
)
ON CONFLICT (id) DO NOTHING;

-- Now insert questions for this test
-- First, clear any existing questions for this test to avoid duplicates
DELETE FROM test_questions WHERE test_id = 'test-js-fundamentals';
DELETE FROM answers WHERE question_id IN (
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'
);
DELETE FROM questions WHERE id IN (
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'
);

-- Question 1: Multiple choice about data types
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q1',
  'Which of the following are JavaScript data types? (Select all that apply)',
  'multiple-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q1a1', 'q1', 'String', true),
  ('q1a2', 'q1', 'Number', true),
  ('q1a3', 'q1', 'Boolean', true),
  ('q1a4', 'q1', 'Character', false),
  ('q1a5', 'q1', 'Symbol', true);

-- Question 2: Single choice about const declaration
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q2',
  'What is the correct way to declare a constant in JavaScript?',
  'single-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q2a1', 'q2', 'var myConst = 5;', false),
  ('q2a2', 'q2', 'let myConst = 5;', false),
  ('q2a3', 'q2', 'const myConst = 5;', true),
  ('q2a4', 'q2', 'constant myConst = 5;', false);

-- Question 3: True/False about JavaScript typing
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q3',
  'JavaScript is a statically typed language.',
  'true-false',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q3a1', 'q3', 'True', false),
  ('q3a2', 'q3', 'False', true);

-- Question 4: Text input question (single-choice with text marker)
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q4',
  'What method is used to add an element to the end of an array in JavaScript? (Type your answer)',
  'single-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q4a1', 'q4', 'push', true),
  ('q4a2', 'q4', 'push()', true),
  ('q4a3', 'q4', 'array.push', true),
  ('q4a4', 'q4', 'array.push()', true);

-- Question 5: Multiple choice about functions
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q5',
  'Which of these are valid ways to create a function in JavaScript? (Select all that apply)',
  'multiple-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q5a1', 'q5', 'function myFunc() {}', true),
  ('q5a2', 'q5', 'const myFunc = () => {}', true),
  ('q5a3', 'q5', 'let myFunc = function() {}', true),
  ('q5a4', 'q5', 'def myFunc() {}', false);

-- Question 6: Single choice about array length
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q6',
  'What will be the output of: [1, 2, 3].length?',
  'single-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q6a1', 'q6', '2', false),
  ('q6a2', 'q6', '3', true),
  ('q6a3', 'q6', '4', false),
  ('q6a4', 'q6', 'undefined', false);

-- Question 7: True/False about null
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q7',
  'In JavaScript, null is an object.',
  'true-false',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q7a1', 'q7', 'True', true),
  ('q7a2', 'q7', 'False', false);

-- Question 8: Multiple choice about loops
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q8',
  'Which of the following are loop structures in JavaScript? (Select all that apply)',
  'multiple-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q8a1', 'q8', 'for loop', true),
  ('q8a2', 'q8', 'while loop', true),
  ('q8a3', 'q8', 'do...while loop', true),
  ('q8a4', 'q8', 'repeat loop', false),
  ('q8a5', 'q8', 'for...of loop', true);

-- Question 9: Single choice about scope
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q9',
  'Which keyword creates block-scoped variables?',
  'single-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q9a1', 'q9', 'var', false),
  ('q9a2', 'q9', 'let', true),
  ('q9a3', 'q9', 'global', false),
  ('q9a4', 'q9', 'scope', false);

-- Question 10: Text input about operators
INSERT INTO questions (id, text, type, category_id, created_by)
VALUES (
  'q10',
  'What operator is used for strict equality comparison in JavaScript? (Type the operator)',
  'single-choice',
  'cat-1',
  'system'
);

INSERT INTO answers (id, question_id, text, is_correct) VALUES
  ('q10a1', 'q10', '===', true);

-- Now link all questions to the test
INSERT INTO test_questions (test_id, question_id, position) VALUES
  ('test-js-fundamentals', 'q1', 1),
  ('test-js-fundamentals', 'q2', 2),
  ('test-js-fundamentals', 'q3', 3),
  ('test-js-fundamentals', 'q4', 4),
  ('test-js-fundamentals', 'q5', 5),
  ('test-js-fundamentals', 'q6', 6),
  ('test-js-fundamentals', 'q7', 7),
  ('test-js-fundamentals', 'q8', 8),
  ('test-js-fundamentals', 'q9', 9),
  ('test-js-fundamentals', 'q10', 10);

-- Create a few more sample tests for variety
INSERT INTO tests (id, title, description, time_limit, category_ids, is_active, created_by)
VALUES 
  (
    'test-js-advanced',
    'Advanced JavaScript Concepts',
    'Test your knowledge of advanced JavaScript topics including closures, promises, and prototypes.',
    2400, -- 40 minutes
    ARRAY['cat-1'],
    true,
    'system'
  ),
  (
    'test-web-basics',
    'Web Development Basics',
    'Test your knowledge of HTML, CSS, and basic web development concepts.',
    1200, -- 20 minutes
    ARRAY['cat-1'],
    true,
    'system'
  )
ON CONFLICT (id) DO NOTHING;