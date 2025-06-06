// COMMENTED OUT - Debug script for fetching test data
// import { createClient } from '@supabase/supabase-js';

// Create direct Supabase client
// const supabase = createClient(
//   'https://gezlcxtprkcceizadvre.supabase.co',
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
// );

// Function to fetch answers for a question based on its type
const fetchAnswersForQuestion = async (questionId, questionType) => {
  console.log(`Fetching answers for question ${questionId} of type ${questionType}`);
  
  try {
    if (['single-choice', 'multiple-choice', 'true-false'].includes(questionType)) {
      // For choice-based questions, get from the answers table
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching answers for question ${questionId}:`, error);
        return [];
      }
      
      console.log(`Found ${data.length} answers for question ${questionId}`);
      return data;
    } 
    else if (questionType === 'matching') {
      // For matching questions, get from the match_items table
      const { data, error } = await supabase
        .from('match_items')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching match items for question ${questionId}:`, error);
        return [];
      }
      
      console.log(`Found ${data.length} match items for question ${questionId}`);
      return data;
    } 
    else if (questionType === 'sequence') {
      // For sequence questions, get from the sequence_items table
      const { data, error } = await supabase
        .from('sequence_items')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching sequence items for question ${questionId}:`, error);
        return [];
      }
      
      console.log(`Found ${data.length} sequence items for question ${questionId}`);
      return data;
    }
    else if (questionType === 'drag-drop') {
      // For drag-drop questions, get from the drag_drop_items table
      const { data, error } = await supabase
        .from('drag_drop_items')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching drag-drop items for question ${questionId}:`, error);
        return [];
      }
      
      console.log(`Found ${data.length} drag-drop items for question ${questionId}`);
      return data;
    }
    
    // If question type is not recognized
    console.warn(`Unknown question type: ${questionType} for question ${questionId}`);
    return [];
  } catch (error) {
    console.error(`Exception fetching answers for question ${questionId}:`, error);
    return [];
  }
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
    
    console.log("Test data:", test);
    
    // Step 2: Fetch questions for the test
    const { data: questionsData, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions!inner(*)')
      .eq('test_id', testId);
      
    if (questionsError) {
      console.error("Error fetching questions:", questionsError);
      return null;
    }
    
    console.log(`Found ${questionsData.length} questions for test ${testId}`);
    
    // Step 3: Fetch answers for each question
    const questionsWithAnswers = [];
    for (const question of questionsData) {
      const questionId = question.question_id;
      const questionType = question.questions?.type || "unknown";
      
      const answers = await fetchAnswersForQuestion(questionId, questionType);
      
      questionsWithAnswers.push({
        id: questionId,
        position: question.position,
        text: question.questions?.text || "Question text unavailable",
        type: questionType,
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
    
    console.log("Complete test data with questions and answers:", testData);
    return testData;
  } catch (error) {
    console.error("Error in fetchTestWithQuestions:", error);
    return null;
  }
};

// Run the fetch operation with the specified test ID
// const testId = 'c72eb931-0332-4fcc-ac33-b4f7be0e83a1';
// const result = await fetchTestWithQuestions(testId);

// if (result) {
  console.log("Successfully fetched test data!");
  console.log(`Test: ${result.title}`);
  console.log(`Questions: ${result.questions.length}`);
  
  // Display question and answer counts
  result.questions.forEach((q, index) => {
    console.log(`Question ${index + 1}: ${q.text} (${q.type}) - ${q.answers.length} answers`);
  });
  
  // Display details of the first question and its answers
  if (result.questions.length > 0) {
    const firstQuestion = result.questions[0];
    console.log("\nFirst Question Details:");
    console.log("ID:", firstQuestion.id);
    console.log("Text:", firstQuestion.text);
    console.log("Type:", firstQuestion.type);
    console.log("Answers:", firstQuestion.answers);
  }
// } else {
//   console.error("Failed to fetch test data!");
// }