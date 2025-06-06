import { 
  TestData, 
  TestFormData, 
  Question 
} from './types';
import { createClientSupabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { fetchQuestions as fetchQuestionsFromLib } from './supabase-questions';
import { 
  mockTests, 
  mockQuestions,
  generateMockId, 
  getMockQuestionsByIds 
} from './supabase-mock';

// Get all tests from Supabase
export async function fetchTests() {
  try {
    const supabase = createClientSupabase();
    
    // Fetch all tests
    const { data: tests, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
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
        
      if (testQuestionsError) throw testQuestionsError;
      
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
            question.position = tq.position;
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
    console.error('Error fetching tests:', error);
    return mockTests;
  }
}

// Get a single test by ID with its questions
export async function fetchTest(testId: string) {
  try {
    const supabase = createClientSupabase();
    
    // Get the test
    const { data: test, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();
      
    if (error) throw error;
    
    // Get questions for this test
    const { data: testQuestions, error: testQuestionsError } = await supabase
      .from('test_questions')
      .select('question_id, position')
      .eq('test_id', testId)
      .order('position');
      
    if (testQuestionsError) throw testQuestionsError;
    
    // Fetch the actual questions
    let questions: Question[] = [];
    
    if (testQuestions && testQuestions.length > 0) {
      const questionIds = testQuestions.map(tq => tq.question_id);
      const allQuestions = await fetchQuestionsById(questionIds);
      
      // Sort according to position in test
      questions = testQuestions.map(tq => {
        const question = allQuestions.find(q => q.id === tq.question_id);
        if (question) {
          question.position = tq.position;
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
    console.error(`Error fetching test ${testId}:`, error);
    return mockTests[0];
  }
}

// Create a new test
export async function createTest(testData: TestFormData) {
  try {
    const supabase = createClientSupabase();
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
      
    if (error) throw error;
    
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
        
      if (questionsError) throw questionsError;
    }
    
    return testId;
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
}

// Update an existing test
export async function updateTest(testData: TestFormData) {
  if (!testData.id) throw new Error('Test ID is required for update');
  
  try {
    const supabase = createClientSupabase();
    
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
      
    if (error) throw error;
    
    return testData.id;
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
}

// Delete a test
export async function deleteTest(testId: string) {
  try {
    const supabase = createClientSupabase();
    
    // Delete test questions first to avoid foreign key constraints
    const { error: questionsError } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', testId);
      
    if (questionsError) throw questionsError;
    
    // Delete test sessions if any
    const { error: sessionsError } = await supabase
      .from('test_sessions')
      .delete()
      .eq('test_id', testId);
      
    if (sessionsError) throw sessionsError;
    
    // Finally delete the test itself
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
}

// Add questions to a test
export async function addQuestionsToTest(testId: string, questionIds: string[]) {
  try {
    const supabase = createClientSupabase();
    
    // First get the highest current position
    const { data: currentQuestions, error: positionError } = await supabase
      .from('test_questions')
      .select('position')
      .eq('test_id', testId)
      .order('position', { ascending: false })
      .limit(1);
      
    if (positionError) throw positionError;
    
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
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error adding questions to test:', error);
    throw error;
  }
}

// Remove a question from a test
export async function removeQuestionFromTest(testId: string, questionId: string) {
  try {
    const supabase = createClientSupabase();
    
    const { error } = await supabase
      .from('test_questions')
      .delete()
      .eq('test_id', testId)
      .eq('question_id', questionId);
      
    if (error) throw error;
    
    // Reorder remaining questions
    const { data: remainingQuestions, error: fetchError } = await supabase
      .from('test_questions')
      .select('id, position')
      .eq('test_id', testId)
      .order('position');
      
    if (fetchError) throw fetchError;
    
    // Update positions
    for (let i = 0; i < remainingQuestions.length; i++) {
      const { error: updateError } = await supabase
        .from('test_questions')
        .update({ position: i + 1 })
        .eq('id', remainingQuestions[i].id);
        
      if (updateError) throw updateError;
    }
    
    return true;
  } catch (error) {
    console.error('Error removing question from test:', error);
    throw error;
  }
}

// Update question order in a test
export async function updateQuestionOrder(testId: string, questionId: string, newPosition: number) {
  try {
    const supabase = createClientSupabase();
    
    // Get current position of the question
    const { data: currentQuestion, error: fetchError } = await supabase
      .from('test_questions')
      .select('position')
      .eq('test_id', testId)
      .eq('question_id', questionId)
      .single();
      
    if (fetchError) throw fetchError;
    
    const currentPosition = currentQuestion.position;
    
    // If position hasn't changed, do nothing
    if (currentPosition === newPosition) {
      return true;
    }
    
    // Manual reordering since we may not have the RPCs
    if (newPosition < currentPosition) {
      // Moving up - increment positions of questions between new and current
      const { error: updateError } = await supabase
        .from('test_questions')
        .update({ position: newPosition + 1 })
        .eq('test_id', testId)
        .gte('position', newPosition)
        .lt('position', currentPosition);
        
      if (updateError) throw updateError;
    } else {
      // Moving down - decrement positions of questions between current and new
      const { error: updateError } = await supabase
        .from('test_questions')
        .update({ position: newPosition - 1 })
        .eq('test_id', testId)
        .gt('position', currentPosition)
        .lte('position', newPosition);
        
      if (updateError) throw updateError;
    }
    
    // Update the position of the question
    const { error } = await supabase
      .from('test_questions')
      .update({ position: newPosition })
      .eq('test_id', testId)
      .eq('question_id', questionId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating question order:', error);
    throw error;
  }
}

// Helper function to fetch questions by IDs
async function fetchQuestionsById(questionIds: string[]) {
  if (!questionIds.length) return [];
  
  try {
    const supabase = createClientSupabase();
    
    // Fetch all questions - use correct table name 'questions' 
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);
      
    if (error) throw error;
    
    // Create array to hold enhanced question data with answers
    const enhancedQuestions: Question[] = [];
    
    // For each question, fetch its answers based on type
    for (const question of questions) {
      let answers: any[] = [];
      
      switch (question.type) {
        case 'multiple-choice':
        case 'single-choice':
        case 'true-false':
          const { data: choiceAnswers, error: choiceError } = await supabase
            .from('answers')
            .select('*')
            .eq('question_id', question.id);
            
          if (!choiceError) answers = choiceAnswers.map((a: any) => ({
            id: a.id,
            questionId: a.question_id,
            text: a.text,
            isCorrect: a.is_correct
          }));
          break;
          
        case 'matching':
          const { data: matchItems, error: matchError } = await supabase
            .from('match_items')
            .select('*')
            .eq('question_id', question.id);
            
          if (!matchError) answers = matchItems.map((m: any) => ({
            id: m.id,
            questionId: m.question_id,
            leftText: m.left_text,
            rightText: m.right_text
          }));
          break;
          
        case 'sequence':
          const { data: sequenceItems, error: sequenceError } = await supabase
            .from('sequence_items')
            .select('*')
            .eq('question_id', question.id)
            .order('correct_position', { ascending: true });
            
          if (!sequenceError) answers = sequenceItems.map((s: any) => ({
            id: s.id,
            questionId: s.question_id,
            text: s.text,
            correctPosition: s.correct_position
          }));
          break;
          
        case 'drag-drop':
          const { data: dragDropItems, error: dragDropError } = await supabase
            .from('drag_drop_items')
            .select('*')
            .eq('question_id', question.id);
            
          if (!dragDropError) answers = dragDropItems.map((d: any) => ({
            id: d.id,
            questionId: d.question_id,
            content: d.content,
            targetZone: d.target_zone
          }));
          break;
      }
      
      // Map database fields to application type
      enhancedQuestions.push({
        id: question.id,
        text: question.text,
        type: question.type,
        categoryId: question.category_id,
        mediaUrl: question.media_url,
        answers: answers,
      });
    }
    
    return enhancedQuestions;
  } catch (error) {
    console.error('Error fetching questions by IDs:', error);
    return [];
  }
}