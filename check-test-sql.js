// Script to directly run the SQL query for testing
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
    // Run the query directly without RPC
    const { data, error } = await supabase
      .from('test_questions')
      .select(`
        *,
        questions!inner(
          id, 
          text,
          type
        ),
        questions!inner.answers(*)
      `)
      .eq('test_id', TEST_ID);
    
    if (error) {
      throw new Error(`Query error: ${error.message}`);
    }
    
    console.log(`\nQuery successful, returned ${data.length} test questions`);
    
    // Process and count answers
    let totalAnswers = 0;
    const questionsWithAnswers = new Set();
    
    data.forEach(tq => {
      const question = tq.questions;
      const answers = question.answers || [];
      
      if (answers.length > 0) {
        questionsWithAnswers.add(question.id);
        totalAnswers += answers.length;
      }
      
      if (answers.length > 0 && questionsWithAnswers.size <= 3) {
        // Show sample answers for up to 3 questions
        console.log(`\nQuestion: ${question.text} (${question.type})`);
        answers.forEach(a => {
          console.log(`- ${a.text || '(No text)'} ${a.is_correct ? '✓' : '✗'}`);
        });
      }
    });
    
    console.log(`\nSummary:`);
    console.log(`- Total test questions: ${data.length}`);
    console.log(`- Questions with answers: ${questionsWithAnswers.size}`);
    console.log(`- Total answers: ${totalAnswers}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);