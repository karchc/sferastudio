// COMMENTED OUT - Debug script for checking tables
// import { createClient } from '@supabase/supabase-js';

// Create direct Supabase client
// const supabase = createClient(
//   'https://gezlcxtprkcceizadvre.supabase.co',
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
// );

// const checkTables = async () => {
  const tables = [
    'answers',
    'answers',
    'questions',
    'questions',
    'test_questions',
    'tests',
    'match_items',
    'sequence_items',
    'drag_drop_items'
  ];
  
  for (const table of tables) {
    try {
      console.log(`Checking table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists with data:`, data);
        
        // If this is one of the answer tables, get the structure by examining a sample record
        if (table === 'answers' || table === 'answers') {
          if (data && data.length > 0) {
            console.log(`Structure of ${table}:`, Object.keys(data[0]));
            
            // Get more samples for answer tables
            const { data: moreSamples, error: sampleError } = await supabase
              .from(table)
              .select('*')
              .limit(5);
              
            if (!sampleError && moreSamples && moreSamples.length > 0) {
              console.log(`Sample data from ${table}:`, moreSamples);
            }
          }
        }
      }
    } catch (e) {
      console.error(`Exception checking ${table}:`, e);
    }
  }
  
  // Get a specific single-choice question and its answers
  try {
    console.log("\nLooking for a single-choice question...");
    const questionsTable = 'questions'; // try this table first
    
    const { data: singleChoiceQ, error: qError } = await supabase
      .from(questionsTable)
      .select('*')
      .eq('type', 'single-choice')
      .limit(1);
      
    if (qError) {
      console.error(`Error finding single-choice question in ${questionsTable}:`, qError.message);
    } else if (singleChoiceQ && singleChoiceQ.length > 0) {
      const question = singleChoiceQ[0];
      console.log("Found single-choice question:", question);
      
      // Try to get answers from answers
      const { data: answers, error: aError } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', question.id);
        
      if (aError) {
        console.error("Error fetching answers:", aError.message);
      } else {
        console.log(`Found ${answers.length} answers for question ${question.id}:`, answers);
      }
    } else {
      console.log(`No single-choice questions found in ${questionsTable}`);
      
      // Try the alternate table name
      const altTable = 'questions';
      const { data: altQ, error: altError } = await supabase
        .from(altTable)
        .select('*')
        .eq('type', 'single-choice')
        .limit(1);
        
      if (altError) {
        console.error(`Error finding single-choice question in ${altTable}:`, altError.message);
      } else if (altQ && altQ.length > 0) {
        const question = altQ[0];
        console.log(`Found single-choice question in ${altTable}:`, question);
        
        // Try to get answers from answers table
        const { data: answers, error: aError } = await supabase
          .from('answers')
          .select('*')
          .eq('question_id', question.id);
          
        if (aError) {
          console.error("Error fetching answers:", aError.message);
        } else {
          console.log(`Found ${answers.length} answers for question ${question.id}:`, answers);
        }
      }
    }
  } catch (e) {
    console.error("Exception finding single-choice question:", e);
  }
// };

// await checkTables();