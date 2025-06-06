import { createClient } from '@supabase/supabase-js';

// Create direct Supabase client
const supabase = createClient(
  'https://gezlcxtprkcceizadvre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
);

// Function to determine the correct table for answers based on question type
const getAnswersTable = (questionType) => {
  if (['single-choice', 'multiple-choice', 'true-false'].includes(questionType)) {
    return 'answers';
  } else if (questionType === 'matching') {
    return 'match_items';
  } else if (questionType === 'sequence') {
    return 'sequence_items';
  } else if (questionType === 'drag-drop') {
    return 'drag_drop_items';
  }
  return 'answers'; // Default fallback
};

// Function to check if a table exists
const tableExists = async (tableName) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`Table ${tableName} does not exist or cannot be accessed:`, error.message);
      return false;
    }
    console.log(`Table ${tableName} exists and is accessible`);
    return true;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
};

// Function to fetch answers for a question
const fetchAnswersForQuestion = async (questionId, questionType) => {
  console.log(`Attempting to fetch answers for question ${questionId} of type ${questionType}`);
  
  // Try with answers first
  const answerTables = ['answers', 'answers'];
  
  for (const table of answerTables) {
    try {
      console.log(`Trying to fetch from ${table} table`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching from ${table}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log(`Successfully found ${data.length} answers in ${table} table`);
        return data;
      } else {
        console.log(`No answers found in ${table} table`);
      }
    } catch (error) {
      console.error(`Exception trying to fetch from ${table}:`, error);
    }
  }
  
  // If we reach here, try specialized tables based on question type
  if (['matching', 'sequence', 'drag-drop'].includes(questionType)) {
    const specializedTable = getAnswersTable(questionType);
    console.log(`Trying specialized table ${specializedTable} for ${questionType} question`);
    
    try {
      const { data, error } = await supabase
        .from(specializedTable)
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching from ${specializedTable}:`, error);
        return [];
      }
      
      if (data && data.length > 0) {
        console.log(`Successfully found ${data.length} items in ${specializedTable} table`);
        return data;
      }
    } catch (error) {
      console.error(`Exception trying to fetch from ${specializedTable}:`, error);
    }
  }
  
  console.warn(`Could not find any answers for question ${questionId}`);
  return [];
};

// Main function to fetch test data
const fetchTestWithQuestions = async (testId) => {
  console.log(`Fetching test data for test ID: ${testId}`);
  
  try {
    // Step 1: Fetch the test data
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();
      
    if (testError) {
      console.error("Error fetching test data:", testError);
      return null;
    }
    
    console.log("Successfully fetched test data:", test.title);
    
    // Step 2: Try different question table names
    const questionTables = ['test_questions', 'questions', 'questions'];
    let questionsData = null;
    
    for (const qTable of questionTables) {
      if (await tableExists(qTable)) {
        console.log(`Trying to fetch questions from ${qTable}`);
        
        try {
          let query;
          
          if (qTable === 'test_questions') {
            // For test_questions, we need to join with another table
            const { data, error } = await supabase
              .from('test_questions')
              .select('*, questions:question_id(*)')
              .eq('test_id', testId);
              
            if (!error && data && data.length > 0) {
              questionsData = data;
              console.log(`Found ${data.length} questions in ${qTable} with join to questions table`);
              break;
            }
            
            // Try another variation with questions
            const { data: data2, error: error2 } = await supabase
              .from('test_questions')
              .select('*, questions:question_id(*)')
              .eq('test_id', testId);
              
            if (!error2 && data2 && data2.length > 0) {
              questionsData = data2;
              console.log(`Found ${data2.length} questions in ${qTable} with join to questions table`);
              break;
            }
          } else {
            // Direct query for other tables
            const { data, error } = await supabase
              .from(qTable)
              .select('*')
              .eq('test_id', testId);
              
            if (!error && data && data.length > 0) {
              questionsData = data;
              console.log(`Found ${data.length} questions in ${qTable}`);
              break;
            }
          }
        } catch (e) {
          console.error(`Error trying to query ${qTable}:`, e);
        }
      }
    }
    
    if (!questionsData || questionsData.length === 0) {
      console.error("Could not find any questions for this test");
      return null;
    }
    
    // Step 3: Fetch answers for each question
    const questionsWithAnswers = [];
    
    for (const question of questionsData) {
      // Extract question ID and data based on the structure
      let questionId, questionText, questionType;
      
      if (question.question_id) {
        // From test_questions join
        questionId = question.question_id;
        
        // Check which join worked
        if (question.questions) {
          questionText = question.questions.text;
          questionType = question.questions.type;
        } else if (question.questions) {
          questionText = question.questions.text;
          questionType = question.questions.type;
        } else {
          console.log("Question data structure:", question);
          questionText = "Unknown question text";
          questionType = "unknown";
        }
      } else {
        // Direct question record
        questionId = question.id;
        questionText = question.text;
        questionType = question.type;
      }
      
      console.log(`Processing question: ${questionId} - ${questionText} (${questionType})`);
      
      // Fetch answers
      const answers = await fetchAnswersForQuestion(questionId, questionType);
      
      questionsWithAnswers.push({
        id: questionId,
        text: questionText,
        type: questionType,
        position: question.position,
        answers: answers
      });
    }
    
    // Step 4: Format and return the complete test data
    const testData = {
      id: test.id,
      title: test.title,
      description: test.description || "",
      timeLimit: test.time_limit,
      categoryId: test.category_id,
      isActive: test.is_active,
      questions: questionsWithAnswers,
    };
    
    return testData;
  } catch (error) {
    console.error("Error in fetchTestWithQuestions:", error);
    return null;
  }
};

// Run the fetch operation with the specified test ID
const testId = 'ee6d5721-45e0-4ceb-a024-d7d5eee8e145';
const result = await fetchTestWithQuestions(testId);

if (result) {
  console.log("\n===== TEST DATA SUMMARY =====");
  console.log(`Test: ${result.title}`);
  console.log(`Description: ${result.description}`);
  console.log(`Questions: ${result.questions.length}`);
  
  // Display question and answer counts
  result.questions.forEach((q, index) => {
    console.log(`\nQuestion ${index + 1}: ${q.text} (${q.type})`);
    console.log(`Answers: ${q.answers.length}`);
    
    // Show answer details
    if (q.answers.length > 0) {
      console.log("Answer details:");
      q.answers.forEach((a, i) => {
        const answerInfo = a.text 
          ? `${a.text}${a.is_correct !== undefined ? (a.is_correct ? ' (CORRECT)' : ' (INCORRECT)') : ''}`
          : JSON.stringify(a);
        console.log(`  ${i + 1}. ${answerInfo}`);
      });
    }
  });
} else {
  console.error("Failed to fetch test data!");
}