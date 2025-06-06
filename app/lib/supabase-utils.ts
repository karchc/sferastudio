import { createClientSupabase } from '@/app/supabase';
import { 
  Test, 
  Question, 
  Category, 
  TestSession, 
  UserAnswer, 
  DashboardData,
  TestSummary
} from '@/app/lib/types';

// Create Supabase client
const supabase = createClientSupabase();

// Tests
export async function getAvailableTests(): Promise<Test[]> {
  const { data, error } = await supabase
    .rpc('get_available_tests');
  
  if (error) {
    console.error('Error getting available tests:', error);
    return [];
  }
  
  return data.tests || [];
}

export async function getTestWithQuestions(testId: string): Promise<{ test: Test, questions: Question[] }> {
  const { data, error } = await supabase
    .rpc('get_test_with_questions', { p_test_id: testId });
  
  if (error) {
    console.error('Error getting test with questions:', error);
    return { test: {} as Test, questions: [] };
  }
  
  return {
    test: data.test,
    questions: data.questions || []
  };
}

// Test Sessions
export async function startTestSession(testId: string): Promise<string> {
  const { data, error } = await supabase
    .rpc('start_test_session', { p_test_id: testId });
  
  if (error) {
    console.error('Error starting test session:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function completeTest(testSessionId: string): Promise<TestSummary> {
  const { data, error } = await supabase
    .rpc('complete_test', { p_test_session_id: testSessionId });
  
  if (error) {
    console.error('Error completing test:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function getTestSession(testSessionId: string): Promise<{ session: TestSession, answers: UserAnswer[] }> {
  const { data, error } = await supabase
    .rpc('get_test_session', { p_test_session_id: testSessionId });
  
  if (error) {
    console.error('Error getting test session:', error);
    return { session: {} as TestSession, answers: [] };
  }
  
  return {
    session: data.session,
    answers: data.answers || []
  };
}

// Answers
export async function submitAnswer(
  testSessionId: string, 
  questionId: string, 
  timeSpent: number, 
  answerData: any
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('submit_answer', { 
      p_test_session_id: testSessionId,
      p_question_id: questionId,
      p_time_spent: timeSpent,
      p_answer_data: answerData
    });
  
  if (error) {
    console.error('Error submitting answer:', error);
    return false;
  }
  
  return true;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .rpc('get_all_categories');
  
  if (error) {
    console.error('Error getting categories:', error);
    return [];
  }
  
  return data.categories || [];
}

// Dashboard
export async function getUserDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabase
    .rpc('get_user_dashboard_data');
  
  if (error) {
    console.error('Error getting dashboard data:', error);
    return {} as DashboardData;
  }
  
  return data;
}

// Admin Functions
export async function getAdminAnalytics() {
  const { data, error } = await supabase
    .rpc('admin_get_analytics');
  
  if (error) {
    console.error('Error getting admin analytics:', error);
    return null;
  }
  
  return data;
}

// Direct DB access functions (for admin pages)

export async function getAllTests() {
  const { data, error } = await supabase
    .from('tests')
    .select(`
      *,
      categories(name),
      profiles(full_name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all tests:', error);
    return [];
  }
  
  return data;
}

export async function getAllQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      categories(name),
      profiles(full_name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching all questions:', error);
    return [];
  }
  
  return data;
}

export async function createTest(testData: Partial<Test>) {
  const { data, error } = await supabase
    .from('tests')
    .insert(testData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating test:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function updateTest(testId: string, testData: Partial<Test>) {
  const { data, error } = await supabase
    .from('tests')
    .update(testData)
    .eq('id', testId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating test:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function deleteTest(testId: string) {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', testId);
  
  if (error) {
    console.error('Error deleting test:', error);
    throw new Error(error.message);
  }
  
  return true;
}

export async function createQuestion(questionData: Partial<Question>) {
  const { data, error } = await supabase
    .from('questions')
    .insert(questionData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating question:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function updateQuestion(questionId: string, questionData: Partial<Question>) {
  const { data, error } = await supabase
    .from('questions')
    .update(questionData)
    .eq('id', questionId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating question:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function deleteQuestion(questionId: string) {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);
  
  if (error) {
    console.error('Error deleting question:', error);
    throw new Error(error.message);
  }
  
  return true;
}

export async function createCategory(categoryData: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating category:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function updateCategory(categoryId: string, categoryData: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', categoryId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating category:', error);
    throw new Error(error.message);
  }
  
  return data;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);
  
  if (error) {
    console.error('Error deleting category:', error);
    throw new Error(error.message);
  }
  
  return true;
}

// Answers management for different question types
export async function getAnswersForQuestion(questionId: string, questionType: string) {
  if (questionType === 'multiple-choice' || questionType === 'single-choice' || questionType === 'true-false') {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching answers:', error);
      return [];
    }
    
    return data;
  } else if (questionType === 'matching') {
    const { data, error } = await supabase
      .from('match_items')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching match items:', error);
      return [];
    }
    
    return data;
  } else if (questionType === 'sequence') {
    const { data, error } = await supabase
      .from('sequence_items')
      .select('*')
      .eq('question_id', questionId)
      .order('correct_position');
    
    if (error) {
      console.error('Error fetching sequence items:', error);
      return [];
    }
    
    return data;
  } else if (questionType === 'drag-drop') {
    const { data, error } = await supabase
      .from('drag_drop_items')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at');
    
    if (error) {
      console.error('Error fetching drag-drop items:', error);
      return [];
    }
    
    return data;
  }
  
  return [];
}

export async function addQuestionsToTest(testId: string, questionIds: string[], startPosition: number = 1) {
  // Get the current highest position
  const { data: existingQuestions, error: fetchError } = await supabase
    .from('test_questions')
    .select('position')
    .eq('test_id', testId)
    .order('position', { ascending: false })
    .limit(1);
  
  if (fetchError) {
    console.error('Error fetching existing questions:', fetchError);
    throw new Error(fetchError.message);
  }
  
  const highestPosition = existingQuestions?.length > 0 ? existingQuestions[0].position : 0;
  const startPos = Math.max(startPosition, highestPosition + 1);
  
  // Prepare the questions to insert
  const questionsToInsert = questionIds.map((questionId, index) => ({
    test_id: testId,
    question_id: questionId,
    position: startPos + index
  }));
  
  const { error } = await supabase
    .from('test_questions')
    .insert(questionsToInsert);
  
  if (error) {
    console.error('Error adding questions to test:', error);
    throw new Error(error.message);
  }
  
  return true;
}

export async function removeQuestionFromTest(testId: string, questionId: string) {
  const { error } = await supabase
    .from('test_questions')
    .delete()
    .eq('test_id', testId)
    .eq('question_id', questionId);
  
  if (error) {
    console.error('Error removing question from test:', error);
    throw new Error(error.message);
  }
  
  return true;
}

export async function reorderTestQuestions(testId: string, questionOrders: { questionId: string, position: number }[]) {
  // We'll use a transaction to ensure all updates succeed or fail together
  const updates = questionOrders.map(order => {
    return supabase
      .from('test_questions')
      .update({ position: order.position })
      .eq('test_id', testId)
      .eq('question_id', order.questionId);
  });
  
  try {
    // Execute all updates in parallel
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error reordering test questions:', error);
    throw error;
  }
}