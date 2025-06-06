// COMMENTED OUT - Debug script for listing tables
// import { createClient } from '@supabase/supabase-js';

// Create direct Supabase client
// const supabase = createClient(
//   'https://gezlcxtprkcceizadvre.supabase.co',
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
// );

// List tables and describe the answers table
const listTables = async () => {
  try {
    // Try executing SQL to list tables
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    });
    
    if (error) {
      console.error("Error listing tables:", error);
      return;
    }
    
    console.log("Tables in the database:");
    console.log(data);
    
    // Check for answers table existence
    const { data: tableCheck, error: tableCheckError } = await supabase
      .from('answers')
      .select('*')
      .limit(1);
      
    if (tableCheckError) {
      console.error("Error checking answers table:", tableCheckError);
    } else {
      console.log("answers table exists");
      
      // Describe the answers table structure
      const { data: columnInfo, error: columnError } = await supabase.rpc('execute_sql', {
        sql_query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'answers';"
      });
      
      if (columnError) {
        console.error("Error getting column info:", columnError);
      } else {
        console.log("answers table structure:");
        console.log(columnInfo);
      }
      
      // Get sample data from the table
      const { data: sampleData, error: sampleError } = await supabase
        .from('answers')
        .select('*')
        .limit(5);
        
      if (sampleError) {
        console.error("Error getting sample data:", sampleError);
      } else {
        console.log("Sample data from answers:");
        console.log(sampleData);
      }
    }
    
    // Check for regular answers table too
    const { data: answersCheck, error: answersCheckError } = await supabase
      .from('answers')
      .select('*')
      .limit(1);
      
    if (answersCheckError) {
      console.error("Error checking answers table:", answersCheckError);
    } else {
      console.log("answers table exists");
      
      // Get sample data from the answers table
      const { data: answersSample, error: answersSampleError } = await supabase
        .from('answers')
        .select('*')
        .limit(5);
        
      if (answersSampleError) {
        console.error("Error getting sample data from answers:", answersSampleError);
      } else {
        console.log("Sample data from answers:");
        console.log(answersSample);
      }
    }
    
    // Also check for a specific single-choice question to examine its answers
    const { data: singleChoiceQuestion, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('type', 'single-choice')
      .limit(1);
      
    if (questionError) {
      console.error("Error finding single-choice question:", questionError);
    } else if (singleChoiceQuestion && singleChoiceQuestion.length > 0) {
      console.log("Found single-choice question:", singleChoiceQuestion[0]);
      
      // Get answers for this question
      const { data: questionAnswers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', singleChoiceQuestion[0].id);
        
      if (answersError) {
        console.error("Error getting answers for question:", answersError);
      } else {
        console.log(`Found ${questionAnswers.length} answers for single-choice question ${singleChoiceQuestion[0].id}:`);
        console.log(questionAnswers);
      }
    }
  } catch (error) {
    console.error("Exception in execution:", error);
  }
};

// Run the function
// await listTables();