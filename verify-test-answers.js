// Script to verify that our SQL-based approach works correctly with a specific test ID
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Target test ID to verify
const TEST_ID = 'ee6d5721-45e0-4ceb-a024-d7d5eee8e145';

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables. Check .env.local file.');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log(`Connected to Supabase at ${SUPABASE_URL}`);
  
  try {
    // 1. Fetch test metadata
    console.log(`\n1. Fetching test metadata for ID: ${TEST_ID}`);
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', TEST_ID)
      .single();
      
    if (testError) {
      throw new Error(`Failed to fetch test: ${testError.message}`);
    }
    
    console.log(`Test found: "${testData.title}"`);
    
    // 2. Fetch test questions
    console.log(`\n2. Fetching questions for test`);
    const { data: questionsData, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', TEST_ID)
      .order('position', { ascending: true });
      
    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }
    
    console.log(`Found ${questionsData.length} questions`);
    
    // Map of question types
    const questionTypes = {};
    const questionById = {};
    
    // Process questions
    const processedQuestions = questionsData.map(q => {
      const question = {
        id: q.question_id,
        text: q.questions?.text || "Question text unavailable",
        type: q.questions?.type || "unknown",
        position: q.position || 0,
        categoryId: q.questions?.category_id
      };
      
      // Track question types
      if (!questionTypes[question.type]) {
        questionTypes[question.type] = 0;
      }
      questionTypes[question.type]++;
      
      // Store question for later reference
      questionById[question.id] = question;
      
      return question;
    });
    
    // Log question types summary
    console.log('\nQuestion types:');
    Object.entries(questionTypes).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
    
    // 3. Fetch answers using SQL JOIN approach
    console.log(`\n3. Fetching answers using SQL JOIN approach`);
    
    try {
      // First try the SQL RPC approach, which might not be available in all projects
      console.log('Attempting SQL RPC approach...');
      
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
            tq.test_id = '${TEST_ID}'
          ORDER BY
            q.id, a.id
        `
      });
      
      if (sqlError) {
        console.warn(`SQL RPC approach failed: ${sqlError.message}`);
        throw new Error('Falling back to direct queries');
      }
      
      if (sqlResult && sqlResult.length > 0) {
        console.log(`SQL JOIN successful! Found ${sqlResult.length} answer records`);
        
        // Process the results
        const answersByQuestionId = {};
        
        sqlResult.forEach(row => {
          if (row.answer_id) { // Skip null answers
            if (!answersByQuestionId[row.question_id]) {
              answersByQuestionId[row.question_id] = [];
            }
            
            answersByQuestionId[row.question_id].push({
              id: row.answer_id,
              text: row.answer_text,
              is_correct: row.is_correct
            });
          }
        });
        
        // Analyze the results
        const questionsWithAnswers = Object.keys(answersByQuestionId).length;
        const totalAnswers = Object.values(answersByQuestionId).reduce((sum, arr) => sum + arr.length, 0);
        const questionsWithoutAnswers = processedQuestions.length - questionsWithAnswers;
        
        console.log(`\nAnalysis:`);
        console.log(`- Total questions: ${processedQuestions.length}`);
        console.log(`- Questions with answers: ${questionsWithAnswers}`);
        console.log(`- Questions without answers: ${questionsWithoutAnswers}`);
        console.log(`- Total answers: ${totalAnswers}`);
        
        // Show a sample of answers
        console.log('\nSample answers:');
        let sampleCount = 0;
        for (const [questionId, answers] of Object.entries(answersByQuestionId)) {
          if (sampleCount < 3) { // Show up to 3 questions
            const question = questionById[questionId];
            console.log(`\nQuestion: ${question.text} (${question.type})`);
            answers.forEach(answer => {
              console.log(`- ${answer.text} (${answer.is_correct ? 'Correct' : 'Incorrect'})`);
            });
            sampleCount++;
          }
        }
        
        return; // Success!
      }
    } catch (sqlError) {
      console.warn(`SQL approach failed with exception: ${sqlError}`);
    }
    
    // 4. Fallback to direct queries approach
    console.log(`\n4. Falling back to direct queries approach`);
    
    // Group question IDs by type for querying
    const questionIds = processedQuestions.map(q => q.id);
    
    // Map question IDs to their types
    const questionTypeMap = {};
    processedQuestions.forEach(q => {
      questionTypeMap[q.id] = q.type;
    });
    
    // Group question IDs by type
    const multipleChoiceIds = questionIds.filter(id => 
      ['multiple-choice', 'single-choice', 'true-false'].includes(questionTypeMap[id])
    );
    const matchingIds = questionIds.filter(id => questionTypeMap[id] === 'matching');
    const sequenceIds = questionIds.filter(id => questionTypeMap[id] === 'sequence');
    const dragDropIds = questionIds.filter(id => questionTypeMap[id] === 'drag-drop');
    
    // Prepare a map to store answers by question ID
    const answersByQuestionId = {};
    
    // Run queries in parallel
    const promises = [];
    
    // 4a. Fetch choice-based answers
    if (multipleChoiceIds.length > 0) {
      console.log(`Fetching choice-based answers for ${multipleChoiceIds.length} questions`);
      promises.push(
        supabase
          .from('answers')
          .select('*')
          .in('question_id', multipleChoiceIds)
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error fetching choice answers: ${error.message}`);
              return;
            }
            
            if (data && data.length > 0) {
              console.log(`Found ${data.length} choice-based answers`);
              
              // Group by question_id
              data.forEach(answer => {
                if (!answersByQuestionId[answer.question_id]) {
                  answersByQuestionId[answer.question_id] = [];
                }
                answersByQuestionId[answer.question_id].push(answer);
              });
            } else {
              console.log('No choice-based answers found');
            }
          })
      );
    }
    
    // 4b. Fetch matching answers
    if (matchingIds.length > 0) {
      console.log(`Fetching matching answers for ${matchingIds.length} questions`);
      promises.push(
        supabase
          .from('match_items')
          .select('*')
          .in('question_id', matchingIds)
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error fetching matching answers: ${error.message}`);
              return;
            }
            
            if (data && data.length > 0) {
              console.log(`Found ${data.length} matching pairs`);
              
              // Group by question_id
              data.forEach(item => {
                if (!answersByQuestionId[item.question_id]) {
                  answersByQuestionId[item.question_id] = [];
                }
                answersByQuestionId[item.question_id].push(item);
              });
            } else {
              console.log('No matching answers found');
            }
          })
      );
    }
    
    // 4c. Fetch sequence answers
    if (sequenceIds.length > 0) {
      console.log(`Fetching sequence answers for ${sequenceIds.length} questions`);
      promises.push(
        supabase
          .from('sequence_items')
          .select('*')
          .in('question_id', sequenceIds)
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error fetching sequence answers: ${error.message}`);
              return;
            }
            
            if (data && data.length > 0) {
              console.log(`Found ${data.length} sequence items`);
              
              // Group by question_id
              data.forEach(item => {
                if (!answersByQuestionId[item.question_id]) {
                  answersByQuestionId[item.question_id] = [];
                }
                answersByQuestionId[item.question_id].push(item);
              });
            } else {
              console.log('No sequence answers found');
            }
          })
      );
    }
    
    // 4d. Fetch drag-drop answers
    if (dragDropIds.length > 0) {
      console.log(`Fetching drag-drop answers for ${dragDropIds.length} questions`);
      promises.push(
        supabase
          .from('drag_drop_items')
          .select('*')
          .in('question_id', dragDropIds)
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error fetching drag-drop answers: ${error.message}`);
              return;
            }
            
            if (data && data.length > 0) {
              console.log(`Found ${data.length} drag-drop items`);
              
              // Group by question_id
              data.forEach(item => {
                if (!answersByQuestionId[item.question_id]) {
                  answersByQuestionId[item.question_id] = [];
                }
                answersByQuestionId[item.question_id].push(item);
              });
            } else {
              console.log('No drag-drop answers found');
            }
          })
      );
    }
    
    // Wait for all queries to complete
    await Promise.all(promises);
    
    // Analyze the results
    const questionsWithAnswers = Object.keys(answersByQuestionId).length;
    const totalAnswers = Object.values(answersByQuestionId).reduce((sum, arr) => sum + arr.length, 0);
    const questionsWithoutAnswers = processedQuestions.length - questionsWithAnswers;
    
    console.log(`\nAnalysis from direct queries:`);
    console.log(`- Total questions: ${processedQuestions.length}`);
    console.log(`- Questions with answers: ${questionsWithAnswers}`);
    console.log(`- Questions without answers: ${questionsWithoutAnswers}`);
    console.log(`- Total answers: ${totalAnswers}`);
    
    // Show a sample of answers
    console.log('\nSample answers:');
    let sampleCount = 0;
    for (const [questionId, answers] of Object.entries(answersByQuestionId)) {
      if (sampleCount < 3) { // Show up to 3 questions
        const question = questionById[questionId];
        console.log(`\nQuestion: ${question.text} (${question.type})`);
        answers.forEach(answer => {
          const answerText = answer.text || answer.left_text || answer.content || '[No text]';
          const isCorrect = answer.is_correct !== undefined ? 
            (answer.is_correct ? 'Correct' : 'Incorrect') : 
            'N/A';
          console.log(`- ${answerText} (${isCorrect})`);
        });
        sampleCount++;
      }
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);