// COMMENTED OUT - Debug script for analyzing answers
// import { createClient } from '@supabase/supabase-js';

// Create direct Supabase client
// const supabase = createClient(
//   'https://gezlcxtprkcceizadvre.supabase.co',
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
// );

// const analyzeAnswers = async () => {
  try {
    // Get all questions
    console.log("Fetching all questions from questions...");
    const { data: allQuestions, error: qError } = await supabase
      .from('questions')
      .select('id, text, type');
      
    if (qError) {
      console.error("Error fetching questions:", qError);
      return;
    }
    
    console.log(`Found ${allQuestions.length} total questions`);
    
    // Group questions by type
    const questionsByType = {};
    allQuestions.forEach(q => {
      if (!questionsByType[q.type]) {
        questionsByType[q.type] = [];
      }
      questionsByType[q.type].push(q);
    });
    
    // Print summary of question types
    console.log("\nQuestion types summary:");
    Object.entries(questionsByType).forEach(([type, questions]) => {
      console.log(`${type}: ${questions.length} questions`);
    });
    
    // For each question type, check for answers in answers
    console.log("\nAnalyzing answers table for each question type:");
    for (const [type, questions] of Object.entries(questionsByType)) {
      console.log(`\nChecking answers for ${type} questions:`);
      
      // Get first 2 questions of this type for detailed analysis
      for (let i = 0; i < Math.min(2, questions.length); i++) {
        const question = questions[i];
        
        // Fetch answers for this question
        const { data: answers, error: aError } = await supabase
          .from('answers')
          .select('id, text, is_correct')
          .eq('question_id', question.id);
          
        if (aError) {
          console.error(`Error fetching answers for ${type} question ${question.id}:`, aError);
          continue;
        }
        
        console.log(`\nQuestion #${i+1} (${type}): ${question.text}`);
        console.log(`Found ${answers.length} answers in answers`);
        
        if (answers.length > 0) {
          console.log("Sample answers:");
          answers.forEach(a => {
            console.log(`- ${a.text} (${a.is_correct ? 'CORRECT' : 'INCORRECT'})`);
          });
        }
      }
    }
    
    // Get overall stats for answers
    const { data: answerCount, error: countError } = await supabase
      .from('answers')
      .select('id', { count: 'exact' });
      
    if (countError) {
      console.error("Error getting answer count:", countError);
    } else {
      console.log(`\nTotal answers in answers: ${answerCount.length}`);
    }
    
    // Count number of questions that have answers
    const { data: uniqueQuestions, error: uniqueError } = await supabase
      .from('answers')
      .select('question_id')
      .limit(1000);
      
    if (uniqueError) {
      console.error("Error getting unique questions with answers:", uniqueError);
    } else {
      const uniqueQuestionIds = new Set(uniqueQuestions.map(a => a.question_id));
      console.log(`Number of questions with answers in answers: ${uniqueQuestionIds.size}`);
    }
  } catch (error) {
    console.error("Unexpected error during analysis:", error);
  }
// };

// Run the analysis
// await analyzeAnswers();