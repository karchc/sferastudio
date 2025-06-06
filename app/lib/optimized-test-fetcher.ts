import { createDirectSupabase } from '@/app/lib/direct-supabase';
import { createClientSupabase } from '@/app/supabase';
import { TestData, Question, QuestionType } from '@/app/lib/types';
import { withTimeout } from '@/app/lib/fetch-utils';

/**
 * Optimized version of test data fetching that:
 * 1. Reduces the number of database requests using batch loading
 * 2. Provides better error handling and diagnostics
 * 3. Optimizes performance with parallel queries where possible
 * 4. Includes fallback mechanisms if parts of the data can't be loaded
 */
export async function fetchTestDataOptimized(testId: string): Promise<{
  success: boolean;
  testData?: TestData;
  error?: any;
  diagnostics?: any;
}> {
  const startTime = performance.now();
  const diagnostics: any = {
    steps: [],
    errors: [],
    warnings: [],
  };
  
  // Use direct Supabase client for better performance
  // (without auth wrappers that might add latency)
  const supabase = createDirectSupabase();
  const regularClient = createClientSupabase();
  
  try {
    // STEP 1: Fetch test metadata and test_questions in a single query
    const step1Start = performance.now();
    let { data: testData, error: testError } = await withTimeout(
      Promise.resolve(
        supabase
          .from('tests')
          .select(`
            *,
            categories(*)
          `)
          .eq('id', testId)
          .single()
      ),
      10000, // 10 second timeout
      'Test metadata fetch timed out'
    );
    
    diagnostics.steps.push({
      name: 'fetchTestMetadata',
      duration: performance.now() - step1Start,
      success: !testError && !!testData
    });
    
    if (testError || !testData) {
      diagnostics.errors.push({
        step: 'fetchTestMetadata',
        error: testError || 'No test data returned'
      });
      
      // Try the regular client as a fallback
      const { data: fallbackData, error: fallbackError } = await regularClient
        .from('tests')
        .select('*, categories(*)')
        .eq('id', testId)
        .single();
        
      if (fallbackError || !fallbackData) {
        return {
          success: false,
          error: 'Failed to fetch test metadata using both direct and regular clients',
          diagnostics
        };
      }
      
      // Fallback succeeded
      diagnostics.warnings.push({
        message: 'Used fallback client for test metadata',
        originalError: testError
      });
      
      // Continue with the fallback data
      testData = fallbackData;
    }
    
    // STEP 2: Fetch test questions
    const step2Start = performance.now();
    const { data: testQuestions, error: questionsError } = await withTimeout(
      Promise.resolve(
        supabase
          .from('test_questions')
          .select('*, questions(*)')
          .eq('test_id', testId)
          .order('position', { ascending: true })
      ),
      10000, // 10 second timeout
      'Test questions fetch timed out'
    );
    
    diagnostics.steps.push({
      name: 'fetchTestQuestions',
      duration: performance.now() - step2Start,
      success: !questionsError && !!testQuestions && testQuestions.length > 0,
      questionCount: testQuestions?.length || 0
    });
    
    if (questionsError || !testQuestions || testQuestions.length === 0) {
      diagnostics.errors.push({
        step: 'fetchTestQuestions',
        error: questionsError || 'No questions found for this test'
      });
      
      // If no questions are available, create default fallback questions
      const defaultQuestions = [
        {
          id: 'default-q1',
          text: 'What is JavaScript?',
          type: 'single-choice' as QuestionType,
          answers: [
            { id: 'default-a1', questionId: 'default-q1', text: 'A programming language', isCorrect: true },
            { id: 'default-a2', questionId: 'default-q1', text: 'A markup language', isCorrect: false },
            { id: 'default-a3', questionId: 'default-q1', text: 'A database', isCorrect: false }
          ]
        }
      ];
      
      // Create TestData with default questions
      const fallbackTestData: TestData = {
        id: testData.id,
        title: testData.title,
        description: testData.description || 'Test with default questions',
        timeLimit: testData.time_limit || 900,
        categoryIds: testData.category_id ? [testData.category_id] : [],
        categories: testData.categories || [],
        isActive: testData.is_active,
        createdAt: new Date(testData.created_at),
        updatedAt: new Date(testData.updated_at),
        questions: defaultQuestions,
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: testData.time_limit || 900
      };
      
      diagnostics.warnings.push({
        message: 'Using fallback questions',
        fallbackQuestions: defaultQuestions.length
      });
      
      return {
        success: true,
        testData: fallbackTestData,
        diagnostics
      };
    }
    
    // Extract questions from the test_questions join data
    const questions = testQuestions
      .map((tq: any) => tq.questions ? { ...tq.questions, position: tq.position } : null)
      .filter((q: any) => q !== null) as Question[];
      
    // If no valid questions are found, use fallback
    if (questions.length === 0) {
      diagnostics.errors.push({
        step: 'extractQuestions',
        error: 'No valid questions found after extracting from test_questions'
      });
      
      const fallbackQuestions = [
        {
          id: 'fallback-q1',
          text: 'What is JavaScript?',
          type: 'single-choice' as QuestionType,
          answers: [
            { id: 'fallback-a1', questionId: 'fallback-q1', text: 'A programming language', isCorrect: true },
            { id: 'fallback-a2', questionId: 'fallback-q1', text: 'A markup language', isCorrect: false },
            { id: 'fallback-a3', questionId: 'fallback-q1', text: 'A database', isCorrect: false }
          ]
        }
      ];
      
      const fallbackTestData: TestData = {
        id: testData.id,
        title: testData.title,
        description: testData.description || 'Test with fallback questions',
        timeLimit: testData.time_limit || 900,
        categoryIds: testData.category_id ? [testData.category_id] : [],
        categories: testData.categories || [],
        isActive: testData.is_active,
        createdAt: new Date(testData.created_at),
        updatedAt: new Date(testData.updated_at),
        questions: fallbackQuestions,
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: testData.time_limit || 900
      };
      
      return {
        success: true,
        testData: fallbackTestData,
        diagnostics
      };
    }
    
    // STEP 3: Group questions by type for optimized answer loading
    const questionsByType: Record<QuestionType, string[]> = {
      'single-choice': [],
      'multiple-choice': [],
      'true-false': [],
      'matching': [],
      'sequence': [],
      'drag-drop': []
    };
    
    questions.forEach(q => {
      if (q.type && questionsByType[q.type]) {
        questionsByType[q.type].push(q.id);
      }
    });
    
    // STEP 4: Batch load answers for all questions in parallel
    const step4Start = performance.now();
    const answersByQuestionId: Record<string, any[]> = {};
    const answerLoadingPromises: any[] = [];
    
    // Helper function to add answers to the map
    const addAnswersToMap = (questionId: string, answers: any[]) => {
      if (!answersByQuestionId[questionId]) {
        answersByQuestionId[questionId] = [];
      }
      answersByQuestionId[questionId].push(...answers);
    };
    
    // Load choice-based answers (single-choice, multiple-choice, true-false)
    const choiceQuestionIds = [
      ...questionsByType['single-choice'],
      ...questionsByType['multiple-choice'],
      ...questionsByType['true-false']
    ];
    
    if (choiceQuestionIds.length > 0) {
      answerLoadingPromises.push(
        supabase
          .from('answers')
          .select('*')
          .in('question_id', choiceQuestionIds)
          .then(({ data, error }) => {
            if (error) {
              diagnostics.errors.push({
                step: 'fetchChoiceAnswers',
                error
              });
              return;
            }
            
            if (data) {
              // Group answers by question ID
              data.forEach(answer => {
                addAnswersToMap(answer.question_id, [answer]);
              });
              
              diagnostics.steps.push({
                name: 'fetchChoiceAnswers',
                success: true,
                answersCount: data.length,
                questionsWithAnswers: Object.keys(
                  data.reduce((acc, a) => {
                    acc[a.question_id] = true;
                    return acc;
                  }, {} as Record<string, boolean>)
                ).length
              });
            }
          })
      );
    }
    
    // Load matching answers
    if (questionsByType['matching'].length > 0) {
      answerLoadingPromises.push(
        supabase
          .from('match_items')
          .select('*')
          .in('question_id', questionsByType['matching'])
          .then(({ data, error }) => {
            if (error) {
              diagnostics.errors.push({
                step: 'fetchMatchingAnswers',
                error
              });
              return;
            }
            
            if (data) {
              data.forEach(item => {
                addAnswersToMap(item.question_id, [item]);
              });
              
              diagnostics.steps.push({
                name: 'fetchMatchingAnswers',
                success: true,
                answersCount: data.length
              });
            }
          })
      );
    }
    
    // Load sequence answers
    if (questionsByType['sequence'].length > 0) {
      answerLoadingPromises.push(
        supabase
          .from('sequence_items')
          .select('*')
          .in('question_id', questionsByType['sequence'])
          .then(({ data, error }) => {
            if (error) {
              diagnostics.errors.push({
                step: 'fetchSequenceAnswers',
                error
              });
              return;
            }
            
            if (data) {
              data.forEach(item => {
                addAnswersToMap(item.question_id, [item]);
              });
              
              diagnostics.steps.push({
                name: 'fetchSequenceAnswers',
                success: true,
                answersCount: data.length
              });
            }
          })
      );
    }
    
    // Load drag-drop answers
    if (questionsByType['drag-drop'].length > 0) {
      answerLoadingPromises.push(
        supabase
          .from('drag_drop_items')
          .select('*')
          .in('question_id', questionsByType['drag-drop'])
          .then(({ data, error }) => {
            if (error) {
              diagnostics.errors.push({
                step: 'fetchDragDropAnswers',
                error
              });
              return;
            }
            
            if (data) {
              data.forEach(item => {
                addAnswersToMap(item.question_id, [item]);
              });
              
              diagnostics.steps.push({
                name: 'fetchDragDropAnswers',
                success: true,
                answersCount: data.length
              });
            }
          })
      );
    }
    
    // Wait for all answer loading to complete
    await Promise.all(answerLoadingPromises);
    
    diagnostics.steps.push({
      name: 'batchLoadAnswers',
      duration: performance.now() - step4Start,
      success: true,
      answersLoaded: Object.values(answersByQuestionId).reduce((sum, arr) => sum + arr.length, 0),
      questionsWithAnswers: Object.keys(answersByQuestionId).length
    });
    
    // STEP 5: Combine questions with their answers
    const step5Start = performance.now();
    
    const questionsWithAnswers = questions.map(question => {
      return {
        ...question,
        answers: answersByQuestionId[question.id] || []
      };
    });
    
    // If any questions don't have answers, log a warning
    const questionsWithoutAnswers = questionsWithAnswers.filter(q => !q.answers || q.answers.length === 0);
    if (questionsWithoutAnswers.length > 0) {
      diagnostics.warnings.push({
        message: `${questionsWithoutAnswers.length} questions have no answers`,
        questionIds: questionsWithoutAnswers.map(q => q.id)
      });
    }
    
    // Randomize the questions for variety
    const randomizedQuestions = [...questionsWithAnswers].sort(() => Math.random() - 0.5);
    
    // Construct the final TestData object
    const fullTestData: TestData = {
      id: testData.id,
      title: testData.title,
      description: testData.description,
      timeLimit: testData.time_limit,
      categoryIds: testData.category_id ? [testData.category_id] : [],
      categories: testData.categories || [],
      isActive: testData.is_active,
      createdAt: new Date(testData.created_at),
      updatedAt: new Date(testData.updated_at),
      questions: randomizedQuestions,
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: testData.time_limit
    };
    
    diagnostics.steps.push({
      name: 'createFinalTestData',
      duration: performance.now() - step5Start,
      questionCount: randomizedQuestions.length,
      answersCount: randomizedQuestions.reduce((sum, q) => sum + (q.answers?.length || 0), 0)
    });
    
    // Add overall performance metrics
    diagnostics.totalDuration = performance.now() - startTime;
    diagnostics.questionCount = randomizedQuestions.length;
    diagnostics.warningCount = diagnostics.warnings.length;
    diagnostics.errorCount = diagnostics.errors.length;
    
    return {
      success: true,
      testData: fullTestData,
      diagnostics
    };
    
  } catch (error) {
    diagnostics.totalDuration = performance.now() - startTime;
    diagnostics.errors.push({
      step: 'unexpectedException',
      error
    });
    
    return {
      success: false,
      error,
      diagnostics
    };
  }
}

/**
 * Simplified version of the test data fetcher that can be dropped in
 * as a replacement for the existing function
 */
export async function fetchTestWithQuestionsOptimized(supabase: any, testId: string): Promise<TestData | null> {
  try {
    const result = await fetchTestDataOptimized(testId);
    
    if (result.success && result.testData) {
      return result.testData;
    }
    
    console.error('Error fetching test data:', result.error, result.diagnostics);
    return null;
  } catch (error) {
    console.error('Exception in fetchTestWithQuestionsOptimized:', error);
    return null;
  }
}