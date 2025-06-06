import { 
  TestData, 
  TestFormData, 
  Question 
} from './types';
import { createDirectSupabase } from './direct-supabase';
import { v4 as uuidv4 } from 'uuid';
import { fetchQuestions as fetchQuestionsFromDirect } from './supabase-questions-direct';

// Helper function to fetch questions by IDs using direct connection
async function fetchQuestionsById(questionIds: string[]) {
  if (!questionIds.length) return [];
  
  return fetchQuestionsFromDirect(questionIds);
}

// Get all tests from Supabase using direct connection
export async function fetchTests() {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Fetching tests directly from Supabase');
    
    // Fetch all tests
    const { data: tests, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching tests directly:', error);
      throw error;
    }
    
    if (!tests || tests.length === 0) {
      console.log('No tests found in database directly');
      return [];
    }
    
    console.log(`Successfully fetched ${tests.length} tests directly`);
    
    // Create array to hold enhanced test data with questions
    const enhancedTests: TestData[] = [];
    
    // For each test, fetch its questions
    for (const test of tests) {
      // Get questions for this test
      const { data: testQuestions, error: testQuestionsError } = await supabase
        .from('test_questions')
        .select('question_id, position')
        .eq('test_id', test.id)
        .order('position');
        
      if (testQuestionsError) {
        console.error('Error fetching test questions directly:', testQuestionsError);
        throw testQuestionsError;
      }
      
      // Now get the actual question objects
      let questions: Question[] = [];
      
      if (testQuestions && testQuestions.length > 0) {
        // Fetch all questions in one go
        const questionIds = testQuestions.map(tq => tq.question_id);
        const allQuestions = await fetchQuestionsById(questionIds);
        
        // Sort according to position in test
        questions = testQuestions.map(tq => {
          const question = allQuestions.find(q => q.id === tq.question_id);
          if (question) {
            (question as any).position = tq.position;
          }
          return question;
        }).filter(Boolean) as Question[];
      }
      
      // Map database fields to application type
      enhancedTests.push({
        id: test.id,
        title: test.title,
        description: test.description,
        timeLimit: test.time_limit,
        categoryIds: test.category_ids || [],
        isActive: test.is_active,
        createdAt: new Date(test.created_at),
        updatedAt: new Date(test.updated_at),
        questions: questions,
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: test.time_limit
      });
    }
    
    return enhancedTests;
  } catch (error) {
    console.error('Exception fetching tests directly:', error);
    throw error;
  }
}

// Get a single test by ID with its questions using direct connection
export async function fetchTest(testId: string) {
  const supabase = createDirectSupabase();
  
  try {
    console.log(`Fetching test directly: ${testId}`);
    
    // Get the test
    const { data: test, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();
      
    if (error) {
      console.error(`Error fetching test ${testId} directly:`, error);
      throw error;
    }
    
    if (!test) {
      console.log(`No test found with ID ${testId} directly`);
      throw new Error(`Test with ID ${testId} not found`);
    }
    
    // Get questions for this test
    const { data: testQuestions, error: testQuestionsError } = await supabase
      .from('test_questions')
      .select('question_id, position')
      .eq('test_id', testId)
      .order('position');
      
    if (testQuestionsError) {
      console.error(`Error fetching test questions for ${testId} directly:`, testQuestionsError);
      throw testQuestionsError;
    }
    
    // Fetch the actual questions
    let questions: Question[] = [];
    
    if (testQuestions && testQuestions.length > 0) {
      const questionIds = testQuestions.map(tq => tq.question_id);
      const allQuestions = await fetchQuestionsById(questionIds);
      
      // Sort according to position in test
      questions = testQuestions.map(tq => {
        const question = allQuestions.find(q => q.id === tq.question_id);
        if (question) {
          (question as any).position = tq.position;
        }
        return question;
      }).filter(Boolean) as Question[];
    }
    
    // Map database fields to application type
    return {
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimit: test.time_limit,
      categoryIds: test.category_ids || [],
      isActive: test.is_active,
      createdAt: new Date(test.created_at),
      updatedAt: new Date(test.updated_at),
      questions: questions
    };
  } catch (error) {
    console.error(`Exception fetching test ${testId} directly:`, error);
    throw error;
  }
}

// Create a new test using direct connection
export async function createTest(testData: TestFormData) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Creating test directly:', testData);
    
    const testId = uuidv4();
    
    // Insert the test
    const { error } = await supabase
      .from('tests')
      .insert({
        id: testId,
        title: testData.title,
        description: testData.description,
        time_limit: testData.timeLimit,
        category_ids: testData.categoryIds,
        is_active: testData.isActive
      });
      
    if (error) {
      console.error('Error creating test directly:', error);
      throw error;
    }
    
    // Add selected questions if any
    if (testData.selectedQuestions && testData.selectedQuestions.length > 0) {
      const testQuestions = testData.selectedQuestions.map((questionId, index) => ({
        test_id: testId,
        question_id: questionId,
        position: index + 1
      }));
      
      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(testQuestions);
        
      if (questionsError) {
        console.error('Error adding questions to test directly:', questionsError);
        throw questionsError;
      }
    }
    
    console.log('Test created successfully with direct access:', testId);
    return testId;
  } catch (error) {
    console.error('Exception creating test directly:', error);
    throw error;
  }
}

// Update an existing test using direct connection
export async function updateTest(testData: TestFormData) {
  if (!testData.id) throw new Error('Test ID is required for update');
  
  const supabase = createDirectSupabase();
  
  try {
    console.log('Updating test directly:', testData);
    
    // Update the test
    const { error } = await supabase
      .from('tests')
      .update({
        title: testData.title,
        description: testData.description,
        time_limit: testData.timeLimit,
        category_ids: testData.categoryIds,
        is_active: testData.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', testData.id);
      
    if (error) {
      console.error('Error updating test directly:', error);
      throw error;
    }
    
    console.log('Test updated successfully with direct access:', testData.id);
    return testData.id;
  } catch (error) {
    console.error('Exception updating test directly:', error);
    throw error;
  }
}

// Delete a test using direct connection
export async function deleteTest(testId: string) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Deleting test directly:', testId);
    
    // Delete test questions first to avoid foreign key constraints
    const { error: questionsError } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', testId);
      
    if (questionsError) {
      console.error('Error deleting test questions directly:', questionsError);
      throw questionsError;
    }
    
    // Delete test sessions if any
    const { error: sessionsError } = await supabase
      .from('test_sessions')
      .delete()
      .eq('test_id', testId);
      
    if (sessionsError) {
      console.error('Error deleting test sessions directly:', sessionsError);
      throw sessionsError;
    }
    
    // Finally delete the test itself
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId);
      
    if (error) {
      console.error('Error deleting test directly:', error);
      throw error;
    }
    
    console.log('Test deleted successfully with direct access');
    return true;
  } catch (error) {
    console.error('Exception deleting test directly:', error);
    throw error;
  }
}

// Add questions to a test using direct connection
export async function addQuestionsToTest(testId: string, questionIds: string[]) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Adding questions to test directly:', testId, questionIds);
    
    // First get the highest current position
    const { data: currentQuestions, error: positionError } = await supabase
      .from('test_questions')
      .select('position')
      .eq('test_id', testId)
      .order('position', { ascending: false })
      .limit(1);
      
    if (positionError) {
      console.error('Error getting current question positions directly:', positionError);
      throw positionError;
    }
    
    let nextPosition = 1;
    if (currentQuestions && currentQuestions.length > 0) {
      nextPosition = (currentQuestions[0].position || 0) + 1;
    }
    
    // Add the new questions
    const testQuestions = questionIds.map((questionId, index) => ({
      test_id: testId,
      question_id: questionId,
      position: nextPosition + index
    }));
    
    const { error } = await supabase
      .from('test_questions')
      .insert(testQuestions);
      
    if (error) {
      console.error('Error adding questions to test directly:', error);
      throw error;
    }
    
    console.log('Questions added to test successfully with direct access');
    return true;
  } catch (error) {
    console.error('Exception adding questions to test directly:', error);
    throw error;
  }
}

// Remove a question from a test using direct connection
export async function removeQuestionFromTest(testId: string, questionId: string) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Removing question from test directly:', testId, questionId);
    
    const { error } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', testId)
      .eq('question_id', questionId);
      
    if (error) {
      console.error('Error removing question from test directly:', error);
      throw error;
    }
    
    // Reorder remaining questions
    const { data: remainingQuestions, error: fetchError } = await supabase
      .from('test_questions')
      .select('id, position')
      .eq('test_id', testId)
      .order('position');
      
    if (fetchError) {
      console.error('Error fetching remaining questions directly:', fetchError);
      throw fetchError;
    }
    
    // Update positions
    for (let i = 0; i < remainingQuestions.length; i++) {
      const { error: updateError } = await supabase
        .from('test_questions')
        .update({ position: i + 1 })
        .eq('id', remainingQuestions[i].id);
        
      if (updateError) {
        console.error('Error updating question positions directly:', updateError);
        throw updateError;
      }
    }
    
    console.log('Question removed from test successfully with direct access');
    return true;
  } catch (error) {
    console.error('Exception removing question from test directly:', error);
    throw error;
  }
}