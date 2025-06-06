// Script to fetch test and answers directly from Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxMTE2MywiZXhwIjoyMDYyNzg3MTYzfQ.EY5mDxpPhFjnlFhhN69c918Spb9PVtlwI7xELK59xws';

// Test ID to analyze
const testId = 'ee6d5721-45e0-4ceb-a024-d7d5eee8e145';

async function fetchTestData() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client created');
    
    // Fetch test data
    console.log(`Fetching test data for ID: ${testId}`);
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();
      
    if (testError) {
      console.error('Error fetching test:', testError);
      return;
    }
    
    console.log(`Test found: ${test.title}`);
    console.log('Test details:', test);
    
    // Fetch questions for this test
    console.log('\nFetching questions...');
    const { data: testQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId);
      
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log(`Found ${testQuestions.length} questions`);
    
    // Extract question IDs and process question data
    const questionIds = testQuestions.map(q => q.question_id);
    const processedQuestions = testQuestions.map(q => ({
      id: q.question_id,
      text: q.questions?.text || 'No text available',
      type: q.questions?.type || 'unknown',
      position: q.position
    }));
    
    // Group questions by type
    const questionsByType = {};
    processedQuestions.forEach(q => {
      if (!questionsByType[q.type]) {
        questionsByType[q.type] = [];
      }
      questionsByType[q.type].push(q.id);
    });
    
    console.log('\nQuestion types:');
    Object.entries(questionsByType).forEach(([type, ids]) => {
      console.log(`- ${type}: ${ids.length} questions`);
    });
    
    // Try SQL-based approach to get all answers efficiently
    console.log('\nFetching answers using SQL query...');
    try {
      const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_sql', {
        query: `
          SELECT
            q.id AS question_id,
            q.text AS question_text,
            q.type AS question_type,
            a.id AS answer_id,
            a.text AS answer_text,
            a.is_correct
          FROM
            test_questions tq
          JOIN
            questions q ON tq.question_id = q.id
          LEFT JOIN
            answers a ON a.question_id = q.id
          WHERE
            tq.test_id = '${testId}'
          ORDER BY
            q.id, a.id
        `
      });
      
      if (sqlError) {
        console.error('SQL error:', sqlError);
      } else if (sqlResult && sqlResult.length > 0) {
        console.log(`SQL query returned ${sqlResult.length} rows`);
        
        // Process SQL results into a question-answer map
        const answersMap = {};
        
        sqlResult.forEach(row => {
          if (row.answer_id) { // Only process if there is an actual answer
            if (!answersMap[row.question_id]) {
              answersMap[row.question_id] = [];
            }
            
            answersMap[row.question_id].push({
              id: row.answer_id,
              text: row.answer_text,
              is_correct: row.is_correct
            });
          }
        });
        
        // Count questions with answers
        const questionsWithAnswers = Object.keys(answersMap).length;
        const totalAnswers = Object.values(answersMap).reduce((sum, arr) => sum + arr.length, 0);
        
        console.log(`\nFound answers for ${questionsWithAnswers} out of ${testQuestions.length} questions`);
        console.log(`Total answers: ${totalAnswers}`);
        
        // Show distribution of answers
        console.log('\nAnswer distribution:');
        Object.entries(answersMap).forEach(([qId, answers]) => {
          const question = processedQuestions.find(q => q.id === qId);
          console.log(`- Question ${qId} (${question?.type}): ${answers.length} answers`);
        });
        
        // Show questions without answers
        const questionsWithoutAnswers = processedQuestions.filter(q => !answersMap[q.id]);
        console.log(`\nQuestions without answers: ${questionsWithoutAnswers.length}`);
        
        if (questionsWithoutAnswers.length > 0) {
          console.log('Questions without answers by type:');
          const noAnswersByType = {};
          questionsWithoutAnswers.forEach(q => {
            if (!noAnswersByType[q.type]) {
              noAnswersByType[q.type] = 0;
            }
            noAnswersByType[q.type]++;
          });
          
          Object.entries(noAnswersByType).forEach(([type, count]) => {
            console.log(`- ${type}: ${count} questions`);
          });
        }
      } else {
        console.log('SQL query returned no results');
      }
    } catch (sqlErr) {
      console.error('Exception executing SQL:', sqlErr);
    }
    
    // Fallback to traditional queries - check a specific answer type
    console.log('\nFetching choice-based answers directly...');
    
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questionIds);
      
    if (answersError) {
      console.error('Error fetching answers:', answersError);
    } else {
      console.log(`Found ${answers.length} choice-based answers`);
      
      // Group by question_id
      const answersByQuestion = {};
      answers.forEach(answer => {
        if (!answersByQuestion[answer.question_id]) {
          answersByQuestion[answer.question_id] = [];
        }
        answersByQuestion[answer.question_id].push(answer);
      });
      
      console.log(`Questions with choice answers: ${Object.keys(answersByQuestion).length}`);
      
      // Count correct answers
      const correctAnswers = answers.filter(a => a.is_correct).length;
      console.log(`Correct answers: ${correctAnswers} / ${answers.length}`);
    }
  } catch (error) {
    console.error('General error:', error);
  }
}

// Run the function
fetchTestData();