-- Update question type constraint to include dropdown and support both underscore and hyphen formats
ALTER TABLE questions DROP CONSTRAINT questions_type_check;

ALTER TABLE questions 
ADD CONSTRAINT questions_type_check 
CHECK (type IN (
  'multiple-choice', 'single-choice', 'true-false', 'matching', 'sequence', 'drag-drop',
  'multiple_choice', 'single_choice', 'true_false', 'dropdown'
));