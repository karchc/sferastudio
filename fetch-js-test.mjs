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
    
    // Step 2: Try to fetch questions using test_questions table with different joins
    const joinOptions = [
      { join: 'questions', alias: 'questions' },
      { join: 'questions', alias: 'questions' }
    ];
    
    let questionsData = null;
    
    for (const option of joinOptions) {
      try {
        // Check if test_questions table exists
        if (!(await tableExists('test_questions'))) {
          console.log('test_questions table does not exist, moving to next approach');
          continue;
        }
        
        // Try to fetch with the current join option
        console.log(`Trying to fetch questions with test_questions join to ${option.join}`);
        
        const query = `*, ${option.join}!inner(*)`;
        const { data, error } = await supabase
          .from('test_questions')
          .select(query)
          .eq('test_id', testId);
          
        if (error) {
          console.error(`Error fetching questions with join to ${option.join}:`, error);
          continue;
        }
        
        if (data && data.length > 0) {
          questionsData = {
            data,
            joinField: option.alias
          };
          console.log(`Successfully found ${data.length} questions with join to ${option.join}`);
          break;
        } else {
          console.log(`No questions found with join to ${option.join}`);
        }
      } catch (error) {
        console.error(`Exception fetching questions with join to ${option.join}:`, error);
      }
    }
    
    // If we couldn't get questions via joins, try direct method
    if (!questionsData) {
      for (const tableName of ['questions', 'questions']) {
        try {
          if (!(await tableExists(tableName))) {
            console.log(`${tableName} table does not exist, skipping`);
            continue;
          }
          
          console.log(`Trying direct fetch from ${tableName} table`);
          
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('test_id', testId);
            
          if (error) {
            console.error(`Error directly fetching from ${tableName}:`, error);
            continue;
          }
          
          if (data && data.length > 0) {
            questionsData = { 
              data,
              direct: true
            };
            console.log(`Successfully found ${data.length} questions directly in ${tableName} table`);
            break;
          } else {
            console.log(`No questions found directly in ${tableName} table`);
          }
        } catch (error) {
          console.error(`Exception directly fetching from ${tableName}:`, error);
        }
      }
    }
    
    if (!questionsData || !questionsData.data || questionsData.data.length === 0) {
      console.error("Could not find any questions for this test");
      return {
        id: test.id,
        title: test.title,
        description: test.description || "",
        timeLimit: test.time_limit,
        categoryId: test.category_id,
        isActive: test.is_active,
        questions: []
      };
    }
    
    // Step 3: Fetch answers for each question
    const questionsWithAnswers = [];
    
    for (const question of questionsData.data) {
      // Extract question ID and data based on the structure
      let questionId, questionText, questionType;
      
      if (questionsData.direct) {
        // Direct question record
        questionId = question.id;
        questionText = question.text;
        questionType = question.type;
      } else if (questionsData.joinField && question[questionsData.joinField]) {
        // From test_questions join
        questionId = question.question_id;
        questionText = question[questionsData.joinField].text;
        questionType = question[questionsData.joinField].type;
      } else if (question.questions) {
        questionId = question.question_id;
        questionText = question.questions.text;
        questionType = question.questions.type;
      } else if (question.questions) {
        questionId = question.question_id;
        questionText = question.questions.text;
        questionType = question.questions.type;
      } else {
        console.log("Could not determine question structure:", question);
        continue;
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
// const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
// const result = await fetchTestWithQuestions(testId);

// if (result) {
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
// } else {
//   console.error("Failed to fetch test data!");
// }