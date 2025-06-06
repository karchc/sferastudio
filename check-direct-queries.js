// Script to directly verify that we can query questions and their answers
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
    // 1. First get the questions for this test
    console.log(`\n1. Fetching questions for test ID: ${TEST_ID}`);
    
    const { data: questionsData, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', TEST_ID);
      
    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`);
    }
    
    console.log(`Found ${questionsData.length} questions`);
    
    // Extract the question IDs and type information
    const questionInfo = questionsData.map(tq => ({
      id: tq.question_id,
      text: tq.questions?.text || 'Unknown',
      type: tq.questions?.type || 'unknown'
    }));
    
    // Group by type
    const questionTypes = {};
    questionInfo.forEach(q => {
      if (!questionTypes[q.type]) {
        questionTypes[q.type] = 0;
      }
      questionTypes[q.type]++;
    });
    
    console.log('\nQuestion types:');
    Object.entries(questionTypes).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });
    
    // 2. Now fetch answers for choice-based questions
    const choiceQuestionIds = questionInfo
      .filter(q => ['single-choice', 'multiple-choice', 'true-false'].includes(q.type))
      .map(q => q.id);
      
    console.log(`\n2. Fetching answers for ${choiceQuestionIds.length} choice-based questions`);
    
    const { data: choiceAnswers, error: choiceError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', choiceQuestionIds);
      
    if (choiceError) {
      throw new Error(`Failed to fetch choice answers: ${choiceError.message}`);
    }
    
    console.log(`Found ${choiceAnswers.length} choice-based answers`);
    
    // Group answers by question ID
    const answersByQuestion = {};
    choiceAnswers.forEach(answer => {
      if (!answersByQuestion[answer.question_id]) {
        answersByQuestion[answer.question_id] = [];
      }
      answersByQuestion[answer.question_id].push(answer);
    });
    
    // Show a few examples
    let count = 0;
    for (const [questionId, answers] of Object.entries(answersByQuestion)) {
      if (count < 3) {
        const question = questionInfo.find(q => q.id === questionId);
        console.log(`\nQuestion: ${question.text} (${question.type})`);
        answers.forEach(answer => {
          console.log(`- ${answer.text} (${answer.is_correct ? 'Correct' : 'Incorrect'})`);
        });
        count++;
      }
    }
    
    // 3. Fetch other answer types
    console.log('\n3. Checking other answer types');
    
    // For matching questions
    const matchingQuestionIds = questionInfo
      .filter(q => q.type === 'matching')
      .map(q => q.id);
      
    if (matchingQuestionIds.length > 0) {
      console.log(`\nFetching matching items for ${matchingQuestionIds.length} questions`);
      
      const { data: matchItems, error: matchError } = await supabase
        .from('match_items')
        .select('*')
        .in('question_id', matchingQuestionIds);
        
      if (matchError) {
        console.error(`Error fetching match items: ${matchError.message}`);
      } else {
        console.log(`Found ${matchItems.length} matching items`);
        
        // Show a sample
        if (matchItems.length > 0) {
          const sampleQuestion = questionInfo.find(q => q.id === matchItems[0].question_id);
          console.log(`\nSample matching question: ${sampleQuestion.text}`);
          matchItems.filter(item => item.question_id === sampleQuestion.id).slice(0, 3).forEach(item => {
            console.log(`- Left: "${item.left_text}" | Right: "${item.right_text}"`);
          });
        }
      }
    }
    
    // For sequence questions
    const sequenceQuestionIds = questionInfo
      .filter(q => q.type === 'sequence')
      .map(q => q.id);
      
    if (sequenceQuestionIds.length > 0) {
      console.log(`\nFetching sequence items for ${sequenceQuestionIds.length} questions`);
      
      const { data: sequenceItems, error: sequenceError } = await supabase
        .from('sequence_items')
        .select('*')
        .in('question_id', sequenceQuestionIds);
        
      if (sequenceError) {
        console.error(`Error fetching sequence items: ${sequenceError.message}`);
      } else {
        console.log(`Found ${sequenceItems.length} sequence items`);
        
        // Show a sample
        if (sequenceItems.length > 0) {
          const sampleQuestion = questionInfo.find(q => q.id === sequenceItems[0].question_id);
          console.log(`\nSample sequence question: ${sampleQuestion.text}`);
          sequenceItems.filter(item => item.question_id === sampleQuestion.id).forEach(item => {
            console.log(`- Position ${item.correct_position}: "${item.text}"`);
          });
        }
      }
    }
    
    // For drag-drop questions
    const dragDropQuestionIds = questionInfo
      .filter(q => q.type === 'drag-drop')
      .map(q => q.id);
      
    if (dragDropQuestionIds.length > 0) {
      console.log(`\nFetching drag-drop items for ${dragDropQuestionIds.length} questions`);
      
      const { data: dragDropItems, error: dragDropError } = await supabase
        .from('drag_drop_items')
        .select('*')
        .in('question_id', dragDropQuestionIds);
        
      if (dragDropError) {
        console.error(`Error fetching drag-drop items: ${dragDropError.message}`);
      } else {
        console.log(`Found ${dragDropItems.length} drag-drop items`);
        
        // Show a sample
        if (dragDropItems.length > 0) {
          const sampleQuestion = questionInfo.find(q => q.id === dragDropItems[0].question_id);
          console.log(`\nSample drag-drop question: ${sampleQuestion.text}`);
          dragDropItems.filter(item => item.question_id === sampleQuestion.id).slice(0, 3).forEach(item => {
            console.log(`- Content: "${item.content}" | Target: "${item.target_zone}"`);
          });
        }
      }
    }
    
    // Summary
    console.log('\n4. Summary of findings:');
    console.log(`- Total questions: ${questionInfo.length}`);
    console.log(`- Choice-based questions with answers: ${Object.keys(answersByQuestion).length}`);
    console.log(`- Total choice-based answers: ${choiceAnswers.length}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);