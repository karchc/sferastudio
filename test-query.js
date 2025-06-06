// COMMENTED OUT - Test query script
// require('dotenv').config();
// const { createClient } = require('@supabase/supabase-js');

// async function run() {
  // Check if we have the necessary environment variables
  console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('SUPABASE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
  
  // Create client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  const testId = 'ee6d5721-45e0-4ceb-a024-d7d5eee8e145';
  console.log(`Fetching data for test ID: ${testId}`);
  
  try {
    // First check if test exists
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();
      
    if (testError) {
      console.error('Test not found:', testError);
      return;
    }
    
    console.log(`Test found: ${test.title}`);
    
    // Get questions
    const { data: testQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId);
      
    if (questionsError || !testQuestions) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log(`Found ${testQuestions.length} questions`);
    
    if (testQuestions.length === 0) {
      console.log('No questions found for this test');
      return;
    }
    
    // Extract question IDs
    const questionIds = testQuestions.map(q => q.question_id);
    console.log(`Question IDs: ${questionIds.slice(0, 3).join(', ')}${questionIds.length > 3 ? '...' : ''}`);
    
    // Get answers for all questions
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questionIds);
      
    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return;
    }
    
    console.log(`Found ${answers ? answers.length : 0} total answers`);
    
    // Group answers by question ID
    const answersByQuestion = {};
    answers.forEach(answer => {
      if (!answersByQuestion[answer.question_id]) {
        answersByQuestion[answer.question_id] = [];
      }
      answersByQuestion[answer.question_id].push(answer);
    });
    
    // Count questions with answers
    const questionsWithAnswers = Object.keys(answersByQuestion).length;
    console.log(`Questions with answers: ${questionsWithAnswers}/${testQuestions.length}`);
    
    // Show first question and its answers
    const firstQuestion = testQuestions[0];
    console.log('\nFirst question:');
    console.log(`ID: ${firstQuestion.question_id}`);
    console.log(`Text: ${firstQuestion.questions?.text}`);
    console.log(`Type: ${firstQuestion.questions?.type}`);
    
    const firstQuestionAnswers = answersByQuestion[firstQuestion.question_id] || [];
    console.log(`\nAnswers for first question (${firstQuestionAnswers.length}):`);
    firstQuestionAnswers.forEach((ans, i) => {
      console.log(`${i+1}. ${ans.text} (Correct: ${ans.is_correct})`);
    });
    
  } catch (err) {
    console.error('Exception:', err);
  }
// }

// run();