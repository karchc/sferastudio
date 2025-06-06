import { 
  TestData,
  Question,
  QuestionType,
  UserAnswer,
  TestSession,
  TestSummary
} from '@/app/lib/types';
import { createClientSupabase } from '@/app/supabase';
import { createDirectSupabase } from '@/app/lib/direct-supabase';
import { fetchWithRetry, withTimeout } from '@/app/lib/fetch-utils';

/**
 * Debug function: Test question types and their associated tables
 * Helps diagnose which question types might be causing issues
 */
export async function testQuestionTypeSupport() {
  const supabase = createDirectSupabase();
  const results: Record<QuestionType, { supported: boolean; error?: any; records?: number }> = {
    'single-choice': { supported: false },
    'multiple-choice': { supported: false },
    'true-false': { supported: false },
    'matching': { supported: false },
    'sequence': { supported: false },
    'drag-drop': { supported: false }
  };

  try {
    // Test single-choice/multiple-choice/true-false
    const { data: choiceAnswers, error: choiceError } = await supabase
      .from('answers')
      .select('count')
      .limit(1);
      
    results['single-choice'].supported = !choiceError;
    results['multiple-choice'].supported = !choiceError;
    results['true-false'].supported = !choiceError;
    
    if (choiceError) {
      results['single-choice'].error = choiceError;
      results['multiple-choice'].error = choiceError;
      results['true-false'].error = choiceError;
    } else {
      // Count all records
      const { count, error } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true });
        
      results['single-choice'].records = count || 0;
      results['multiple-choice'].records = count || 0;
      results['true-false'].records = count || 0;
    }
    
    // Test matching
    const { data: matchItems, error: matchError } = await supabase
      .from('match_items')
      .select('count')
      .limit(1);
      
    results['matching'].supported = !matchError;
    if (matchError) {
      results['matching'].error = matchError;
    } else {
      const { count, error } = await supabase
        .from('match_items')
        .select('*', { count: 'exact', head: true });
        
      results['matching'].records = count || 0;
    }
    
    // Test sequence
    const { data: sequenceItems, error: sequenceError } = await supabase
      .from('sequence_items')
      .select('count')
      .limit(1);
      
    results['sequence'].supported = !sequenceError;
    if (sequenceError) {
      results['sequence'].error = sequenceError;
    } else {
      const { count, error } = await supabase
        .from('sequence_items')
        .select('*', { count: 'exact', head: true });
        
      results['sequence'].records = count || 0;
    }
    
    // Test drag-drop
    const { data: dragDropItems, error: dragDropError } = await supabase
      .from('drag_drop_items')
      .select('count')
      .limit(1);
      
    results['drag-drop'].supported = !dragDropError;
    if (dragDropError) {
      results['drag-drop'].error = dragDropError;
    } else {
      const { count, error } = await supabase
        .from('drag_drop_items')
        .select('*', { count: 'exact', head: true });
        
      results['drag-drop'].records = count || 0;
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error, results };
  }
}

/**
 * Debug function: Trace the test data loading process with detailed steps
 * This helps identify exactly where things might be failing
 */
export async function traceTestDataLoading(testId: string) {
  const trace: { step: string; success: boolean; duration: number; data?: any; error?: any }[] = [];
  const startTime = performance.now();
  const supabase = createClientSupabase();
  const directClient = createDirectSupabase();
  
  try {
    // Step 1: Load test metadata
    const step1Start = performance.now();
    const testResult = await withTimeout(
      Promise.resolve(
        directClient
          .from('tests')
          .select('*, categories(*)')
          .eq('id', testId)
          .single()
      ),
      10000,
      'Test metadata fetch timed out'
    );
    const step1Duration = performance.now() - step1Start;
    
    trace.push({
      step: '1. Fetch test metadata',
      success: !testResult.error && !!testResult.data,
      duration: step1Duration,
      data: testResult.data,
      error: testResult.error
    });
    
    if (testResult.error || !testResult.data) {
      return {
        success: false,
        error: 'Failed to load test metadata',
        trace,
        totalDuration: performance.now() - startTime
      };
    }
    
    // Step 2: Load test questions
    const step2Start = performance.now();
    const questionsResult = await withTimeout(
      Promise.resolve(
        directClient
          .from('test_questions')
          .select('*, questions(*)')
          .eq('test_id', testId)
          .order('position', { ascending: true })
      ),
      10000,
      'Test questions fetch timed out'
    );
    const step2Duration = performance.now() - step2Start;
    
    trace.push({
      step: '2. Fetch test questions',
      success: !questionsResult.error && !!questionsResult.data,
      duration: step2Duration,
      data: questionsResult.data && questionsResult.data.length,
      error: questionsResult.error
    });
    
    if (questionsResult.error || !questionsResult.data || questionsResult.data.length === 0) {
      return {
        success: false,
        error: 'Failed to load test questions or no questions found',
        trace,
        totalDuration: performance.now() - startTime
      };
    }
    
    // Step 3: Process questions and fetch answers
    const step3Start = performance.now();
    const questionsWithAnswers = [];
    const answerErrors = [];
    
    for (const tq of questionsResult.data) {
      const question = tq.questions;
      if (!question) {
        answerErrors.push(`Question missing in test_question: ${tq.id}`);
        continue;
      }
      
      let answers = [];
      let answerError = null;
      
      try {
        switch (question.type) {
          case 'multiple-choice':
          case 'single-choice':
          case 'true-false': {
            const { data, error } = await supabase
              .from('answers')
              .select('*')
              .eq('question_id', question.id);
              
            answers = data || [];
            answerError = error;
            break;
          }
          
          case 'matching': {
            const { data, error } = await supabase
              .from('match_items')
              .select('*')
              .eq('question_id', question.id);
              
            answers = data || [];
            answerError = error;
            break;
          }
          
          case 'sequence': {
            const { data, error } = await supabase
              .from('sequence_items')
              .select('*')
              .eq('question_id', question.id)
              .order('correct_position', { ascending: true });
              
            answers = data || [];
            answerError = error;
            break;
          }
          
          case 'drag-drop': {
            const { data, error } = await supabase
              .from('drag_drop_items')
              .select('*')
              .eq('question_id', question.id);
              
            answers = data || [];
            answerError = error;
            break;
          }
          
          default:
            answerError = `Unknown question type: ${question.type}`;
        }
        
        if (answerError) {
          answerErrors.push(`Error loading answers for question ${question.id}: ${answerError}`);
        }
        
        questionsWithAnswers.push({
          ...question,
          position: tq.position,
          answers: answers
        });
      } catch (error) {
        answerErrors.push(`Exception loading answers for question ${question.id}: ${error}`);
      }
    }
    
    const step3Duration = performance.now() - step3Start;
    
    trace.push({
      step: '3. Process questions and fetch answers',
      success: questionsWithAnswers.length > 0,
      duration: step3Duration,
      data: {
        processedCount: questionsWithAnswers.length,
        totalQuestions: questionsResult.data.length,
        answerErrors: answerErrors
      }
    });
    
    if (questionsWithAnswers.length === 0) {
      return {
        success: false,
        error: 'Failed to process any questions with answers',
        trace,
        totalDuration: performance.now() - startTime
      };
    }
    
    // Step 4: Construct final test data
    const step4Start = performance.now();
    
    const randomizedQuestions = [...questionsWithAnswers].sort(() => Math.random() - 0.5);
    
    const fullTestData: TestData = {
      id: testResult.data.id,
      title: testResult.data.title,
      description: testResult.data.description,
      timeLimit: testResult.data.time_limit,
      categoryIds: testResult.data.category_id ? [testResult.data.category_id] : [],
      categories: testResult.data.categories || [],
      isActive: testResult.data.is_active,
      createdAt: new Date(testResult.data.created_at),
      updatedAt: new Date(testResult.data.updated_at),
      questions: randomizedQuestions,
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: testResult.data.time_limit
    };
    
    const step4Duration = performance.now() - step4Start;
    
    trace.push({
      step: '4. Construct final test data',
      success: true,
      duration: step4Duration,
      data: {
        id: fullTestData.id,
        title: fullTestData.title,
        questionCount: fullTestData.questions.length
      }
    });
    
    return {
      success: true,
      testData: fullTestData,
      trace,
      totalDuration: performance.now() - startTime
    };
    
  } catch (error) {
    return {
      success: false,
      error,
      trace,
      totalDuration: performance.now() - startTime
    };
  }
}

/**
 * Debug function: Make a test question submission to test the submission process
 */
export async function testQuestionSubmission(testId: string, questionId: string, questionType: QuestionType) {
  const supabase = createClientSupabase();
  
  try {
    // Generate sample answer data based on question type
    let answerData: any = null;
    
    switch (questionType) {
      case 'single-choice':
      case 'true-false':
        // Get first answer for this question
        const { data: choiceAnswers } = await supabase
          .from('answers')
          .select('id')
          .eq('question_id', questionId)
          .limit(1);
          
        answerData = { selected_answer_ids: choiceAnswers && choiceAnswers[0] ? [choiceAnswers[0].id] : [] };
        break;
        
      case 'multiple-choice':
        // Get all answers for this question, select first two
        const { data: multiAnswers } = await supabase
          .from('answers')
          .select('id')
          .eq('question_id', questionId)
          .limit(2);
          
        answerData = { 
          selected_answer_ids: multiAnswers ? multiAnswers.map(a => a.id) : [] 
        };
        break;
        
      case 'matching':
        // Get match items
        const { data: matchItems } = await supabase
          .from('match_items')
          .select('id, right_text')
          .eq('question_id', questionId);
          
        if (matchItems && matchItems.length > 0) {
          // For testing, just match each item with the first available right text
          const firstRightText = matchItems[0].right_text;
          answerData = {
            matches: matchItems.map(item => ({
              match_item_id: item.id,
              selected_right_text: firstRightText  // Intentionally wrong for most items
            }))
          };
        }
        break;
        
      case 'sequence':
        // Get sequence items
        const { data: sequenceItems } = await supabase
          .from('sequence_items')
          .select('id')
          .eq('question_id', questionId);
          
        if (sequenceItems && sequenceItems.length > 0) {
          // For testing, just assign a random position to each item
          answerData = {
            sequence: sequenceItems.map((item, index) => ({
              sequence_item_id: item.id,
              selected_position: index + 1  // Simple 1-based indexing
            }))
          };
        }
        break;
        
      case 'drag-drop':
        // Get drag-drop items
        const { data: dragDropItems } = await supabase
          .from('drag_drop_items')
          .select('id')
          .eq('question_id', questionId);
          
        if (dragDropItems && dragDropItems.length > 0) {
          // For testing, assign all items to zone "A"
          answerData = {
            placements: dragDropItems.map(item => ({
              drag_drop_item_id: item.id,
              selected_zone: "A"  // Simple zone name
            }))
          };
        }
        break;
    }
    
    if (!answerData) {
      return {
        success: false,
        error: "Could not generate valid answer data"
      };
    }
    
    // Create test session
    const sessionId = `debug-session-${Date.now()}`;
    const { data: sessionData, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        id: sessionId,
        test_id: testId,
        user_id: 'debug-user',  // This would normally be the actual user ID
        status: 'in_progress',
        start_time: new Date().toISOString()
      })
      .select();
      
    if (sessionError) {
      return {
        success: false,
        error: "Failed to create test session",
        details: sessionError
      };
    }
    
    // Submit answer
    const { data: answerResult, error: answerError } = await supabase
      .from('user_answers')
      .insert({
        session_id: sessionId,
        question_id: questionId,
        answer_data: answerData,
        time_spent: 10  // 10 seconds spent on question
      })
      .select();
      
    if (answerError) {
      return {
        success: false,
        error: "Failed to submit answer",
        details: answerError,
        sessionId
      };
    }
    
    // Complete the test session
    const { data: completeData, error: completeError } = await supabase
      .from('test_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        time_spent: 60  // 60 seconds total
      })
      .eq('id', sessionId)
      .select();
      
    if (completeError) {
      return {
        success: false,
        error: "Failed to complete test session",
        details: completeError,
        sessionId,
        answerSubmitted: true
      };
    }
    
    return {
      success: true,
      sessionId,
      answerData,
      sessionData,
      answerResult,
      completeData
    };
    
  } catch (error) {
    return {
      success: false,
      error: `Exception in testQuestionSubmission: ${error}`
    };
  }
}

/**
 * Debug function: Test the optimized batch loading technique for questions
 * This demonstrates an optimized approach for loading questions and answers
 */
export async function loadTestDataOptimized(testId: string) {
  const startTime = performance.now();
  const supabase = createDirectSupabase();
  
  try {
    // Step 1: Load test metadata and questions in a single query with nesting
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select(`
        *,
        categories(*),
        test_questions!inner(
          position,
          questions(*)
        )
      `)
      .eq('id', testId)
      .single();
      
    if (testError || !testData) {
      return {
        success: false,
        error: testError || 'No test data found',
        duration: performance.now() - startTime
      };
    }
    
    // Extract the questions from the nested structure
    const questions = testData.test_questions.map((tq: any) => ({
      ...tq.questions,
      position: tq.position
    })).sort((a: any, b: any) => a.position - b.position);
    
    // Step 2: Get all question IDs
    const questionIds = questions.map((q: any) => q.id);
    
    // Step 3: Batch load all answers for these questions in a single query per answer type
    // Get question types
    const questionTypes = questions.reduce((types: any, q: any) => {
      if (!types[q.type]) {
        types[q.type] = [];
      }
      types[q.type].push(q.id);
      return types;
    }, {} as Record<QuestionType, string[]>);
    
    // Prepare a map to store answers by question ID
    const answersByQuestionId: Record<string, any[]> = {};
    
    // Load answers for each question type in a single batch query
    const loadPromises = [] as Promise<any>[];
    
    // Single-choice, multiple-choice, true-false
    if (questionTypes['single-choice']?.length || 
        questionTypes['multiple-choice']?.length || 
        questionTypes['true-false']?.length) {
      
      const choiceQuestionIds = [
        ...(questionTypes['single-choice'] || []),
        ...(questionTypes['multiple-choice'] || []),
        ...(questionTypes['true-false'] || [])
      ];
      
      loadPromises.push(
        supabase
          .from('answers')
          .select('*')
          .in('question_id', choiceQuestionIds)
          .then(({ data, error }) => {
            if (error) throw error;
            if (data) {
              // Group answers by question ID
              data.forEach(answer => {
                if (!answersByQuestionId[answer.question_id]) {
                  answersByQuestionId[answer.question_id] = [];
                }
                answersByQuestionId[answer.question_id].push(answer);
              });
            }
          })
      );
    }
    
    // Matching
    if (questionTypes['matching']?.length) {
      loadPromises.push(
        supabase
          .from('match_items')
          .select('*')
          .in('question_id', questionTypes['matching'])
          .then(({ data, error }) => {
            if (error) throw error;
            if (data) {
              data.forEach(item => {
                if (!answersByQuestionId[item.question_id]) {
                  answersByQuestionId[item.question_id] = [];
                }
                answersByQuestionId[item.question_id].push(item);
              });
            }
          })
      );
    }
    
    // Sequence
    if (questionTypes['sequence']?.length) {
      loadPromises.push(
        supabase
          .from('sequence_items')
          .select('*')
          .in('question_id', questionTypes['sequence'])
          .then(({ data, error }) => {
            if (error) throw error;
            if (data) {
              data.forEach(item => {
                if (!answersByQuestionId[item.question_id]) {
                  answersByQuestionId[item.question_id] = [];
                }
                answersByQuestionId[item.question_id].push(item);
              });
            }
          })
      );
    }
    
    // Drag-drop
    if (questionTypes['drag-drop']?.length) {
      loadPromises.push(
        supabase
          .from('drag_drop_items')
          .select('*')
          .in('question_id', questionTypes['drag-drop'])
          .then(({ data, error }) => {
            if (error) throw error;
            if (data) {
              data.forEach(item => {
                if (!answersByQuestionId[item.question_id]) {
                  answersByQuestionId[item.question_id] = [];
                }
                answersByQuestionId[item.question_id].push(item);
              });
            }
          })
      );
    }
    
    // Execute all promises in parallel
    await Promise.all(loadPromises);
    
    // Step 4: Assign answers to questions
    const questionsWithAnswers = questions.map(q => ({
      ...q,
      answers: answersByQuestionId[q.id] || []
    }));
    
    // Step 5: Construct the final test data object
    const randomizedQuestions = [...questionsWithAnswers].sort(() => Math.random() - 0.5);
    
    // Create final test data structure
    const fullTestData: TestData = {
      id: testData.id,
      title: testData.title,
      description: testData.description,
      timeLimit: testData.time_limit,
      categoryId: testData.category_id,
      category: testData.categories,
      isActive: testData.is_active,
      createdAt: new Date(testData.created_at),
      updatedAt: new Date(testData.updated_at),
      questions: randomizedQuestions,
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: testData.time_limit
    };
    
    return {
      success: true,
      testData: fullTestData,
      questionCount: randomizedQuestions.length,
      answerCount: Object.values(answersByQuestionId).reduce((sum, arr) => sum + arr.length, 0),
      duration: performance.now() - startTime
    };
    
  } catch (error) {
    return {
      success: false,
      error,
      duration: performance.now() - startTime
    };
  }
}

/**
 * Get hardcoded test data for specific test IDs
 * This is used as a fallback when Supabase is slow or not responding
 */
export function getHardcodedTestData(testId: string): TestData | null {
  if (testId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
    return {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'JavaScript Basics',
      description: 'Test your knowledge of basic JavaScript concepts',
      timeLimit: 900,
      categoryId: '11111111-1111-1111-1111-111111111111',
      category: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Programming',
        description: 'Computer programming and software development topics'
      },
      isActive: true,
      createdAt: new Date('2025-05-15T06:35:12.327Z'),
      updatedAt: new Date('2025-05-15T06:35:12.327Z'),
      questions: [],
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: 900
    };
  }
  
  return null;
}

/**
 * Get hardcoded questions for specific test IDs
 * This is used as a fallback when Supabase is slow or not responding
 */
export function getHardcodedQuestions(testId: string): Question[] {
  if (testId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
    return [
      {
        id: '11111111-2222-3333-4444-555555555555',
        text: 'Which of the following is NOT a JavaScript data type?',
        type: 'multiple-choice',
        position: 1,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'a1', text: 'String', is_correct: false },
          { id: 'a2', text: 'Number', is_correct: false },
          { id: 'a3', text: 'Boolean', is_correct: false },
          { id: 'a4', text: 'Character', is_correct: true }
        ]
      },
      {
        id: '22222222-3333-4444-5555-666666666666',
        text: 'Which of the following are JavaScript frameworks or libraries?',
        type: 'multiple-choice',
        position: 2,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'b1', text: 'React', is_correct: true },
          { id: 'b2', text: 'Vue', is_correct: true },
          { id: 'b3', text: 'Angular', is_correct: true },
          { id: 'b4', text: 'Python', is_correct: false }
        ]
      },
      {
        id: '33333333-4444-5555-6666-777777777777',
        text: 'Which symbol is used for single-line comments in JavaScript?',
        type: 'single-choice',
        position: 3,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'c1', text: '//', is_correct: true },
          { id: 'c2', text: '/*', is_correct: false },
          { id: 'c3', text: '#', is_correct: false },
          { id: 'c4', text: '--', is_correct: false }
        ]
      },
      {
        id: '44444444-5555-6666-7777-888888888888',
        text: 'JavaScript is the same as Java.',
        type: 'true-false',
        position: 4,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'd1', text: 'True', is_correct: false },
          { id: 'd2', text: 'False', is_correct: true }
        ]
      },
      {
        id: '55555555-6666-7777-8888-999999999999',
        text: 'Match the JavaScript concept with its description:',
        type: 'matching',
        position: 5,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'e1', left_text: 'Variable', right_text: 'A container for data' },
          { id: 'e2', left_text: 'Function', right_text: 'A reusable block of code' },
          { id: 'e3', left_text: 'Array', right_text: 'An ordered collection of items' },
          { id: 'e4', left_text: 'Object', right_text: 'A collection of key-value pairs' }
        ]
      },
      {
        id: '66666666-7777-8888-9999-aaaaaaaaaaaa',
        text: 'Arrange the following JavaScript execution steps in the correct order:',
        type: 'sequence',
        position: 6,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'f1', text: 'Parse the JavaScript code', correct_position: 1 },
          { id: 'f2', text: 'Create execution context', correct_position: 2 },
          { id: 'f3', text: 'Execute the code line by line', correct_position: 3 },
          { id: 'f4', text: 'Handle any errors or exceptions', correct_position: 4 }
        ]
      },
      {
        id: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
        text: 'Categorize the following JavaScript elements into their correct types:',
        type: 'drag-drop',
        position: 7,
        categoryId: '11111111-1111-1111-1111-111111111111',
        answers: [
          { id: 'g1', content: 'String', target_zone: 'Primitive_Type' },
          { id: 'g2', content: 'Number', target_zone: 'Primitive_Type' },
          { id: 'g3', content: 'Boolean', target_zone: 'Primitive_Type' },
          { id: 'g4', content: 'Array', target_zone: 'Object_Type' },
          { id: 'g5', content: 'Function', target_zone: 'Object_Type' },
          { id: 'g6', content: 'Date', target_zone: 'Object_Type' }
        ]
      }
    ];
  }
  
  return [];
}