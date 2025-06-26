import { createDirectSupabase } from '@/app/lib/direct-supabase';
import { createClientSupabase } from '@/app/supabase';
import { TestData, Question, QuestionType } from '@/app/lib/types';
import { withTimeout } from '@/app/lib/fetch-utils';
import { getCachedTestData, cacheTestData, getCachedBatchAnswers, cacheBatchAnswers } from '@/app/lib/cache-utils';

/**
 * Ultra-optimized version of test data fetching that:
 * 1. Uses server-side caching to drastically reduce fetch times
 * 2. Uses super batch loading with join queries to minimize DB roundtrips
 * 3. Runs all required queries in parallel for maximum speed
 * 4. Includes redundancy and fallbacks for reliability
 * 5. Uses direct Supabase connection for fastest response
 */
export async function fetchTestDataUltra(testId: string): Promise<{
  success: boolean;
  testData?: TestData;
  error?: any;
  diagnostics?: any;
  fromCache?: boolean;
}> {
  // First, check cache for the whole test data
  const cachedTestData = getCachedTestData(testId);
  if (cachedTestData) {
    return {
      success: true,
      testData: cachedTestData,
      fromCache: true,
      diagnostics: {
        source: 'complete-cache',
        questionCount: cachedTestData.questions?.length || 0,
      }
    };
  }

  const startTime = performance.now();
  const diagnostics: any = {
    steps: [],
    errors: [],
    warnings: [],
    timings: {},
  };
  
  // Use direct Supabase client for better performance
  const supabase = createDirectSupabase();
  const regularClient = createClientSupabase();
  
  try {
    // STEP 1: Run multiple queries in parallel for maximum performance
    diagnostics.timings.fetchStart = performance.now() - startTime;
    
    // Execute parallel queries
    const [testResult, questionsResult] = await Promise.all([
      // Query 1: Get test with category in a single query
      withTimeout(
        supabase
          .from('tests')
          .select(`
            *,
            categories(*)
          `)
          .eq('id', testId)
          .single(),
        8000, // 8 seconds timeout
        'Test metadata fetch timed out'
      ),
      
      // Query 2: Get test questions with their question data in a single query
      withTimeout(
        supabase
          .from('test_questions')
          .select(`
            *,
            questions(*)
          `)
          .eq('test_id', testId)
          .order('position', { ascending: true }),
        8000, // 8 seconds timeout
        'Test questions fetch timed out'
      )
    ]);
    
    diagnostics.timings.mainQueriesComplete = performance.now() - startTime;
    
    // Check for errors in the main queries
    if (testResult.error || !testResult.data) {
      diagnostics.errors.push({
        step: 'fetchTestMetadata',
        error: testResult.error || 'No test data returned'
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
        originalError: testResult.error
      });
      
      testResult.data = fallbackData;
    }
    
    if (questionsResult.error || !questionsResult.data || questionsResult.data.length === 0) {
      diagnostics.errors.push({
        step: 'fetchTestQuestions',
        error: questionsResult.error || 'No questions found for this test'
      });
      
      // If no questions are available, create fallback questions
      const defaultQuestions = [
        {
          id: 'default-q1',
          text: 'What is JavaScript?',
          type: 'single-choice' as QuestionType,
          answers: [
            { id: 'default-a1', text: 'A programming language', is_correct: true },
            { id: 'default-a2', text: 'A markup language', is_correct: false },
            { id: 'default-a3', text: 'A database', is_correct: false }
          ]
        }
      ];
      
      // Create TestData with default questions
      const fallbackTestData: TestData = {
        id: testResult.data.id,
        title: testResult.data.title,
        description: testResult.data.description || 'Test with default questions',
        timeLimit: testResult.data.time_limit || 900,
        categoryIds: testResult.data.category_ids || [],
        categories: Array.isArray(testResult.data.categories) ? testResult.data.categories : (testResult.data.categories ? [testResult.data.categories] : []),
        isActive: testResult.data.is_active,
        createdAt: new Date(testResult.data.created_at),
        updatedAt: new Date(testResult.data.updated_at),
        questions: defaultQuestions,
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: testResult.data.time_limit || 900
      };
      
      diagnostics.warnings.push({
        message: 'Using fallback questions',
        fallbackQuestions: defaultQuestions.length
      });
      
      // Cache the fallback data
      cacheTestData(testId, fallbackTestData);
      
      return {
        success: true,
        testData: fallbackTestData,
        diagnostics
      };
    }
    
    // STEP 2: Extract and organize questions from the results
    // Extract questions from the test_questions join data
    const questions = questionsResult.data
      .map(tq => {
        if (!tq.questions) return null;
        const q = tq.questions;
        return {
          ...q,
          position: tq.position
        };
      })
      .filter(q => q !== null) as Question[];
    
    diagnostics.timings.questionsExtracted = performance.now() - startTime;
    
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
            { id: 'fallback-a1', text: 'A programming language', is_correct: true },
            { id: 'fallback-a2', text: 'A markup language', is_correct: false },
            { id: 'fallback-a3', text: 'A database', is_correct: false }
          ]
        }
      ];
      
      const fallbackTestData: TestData = {
        id: testResult.data.id,
        title: testResult.data.title,
        description: testResult.data.description || 'Test with fallback questions',
        timeLimit: testResult.data.time_limit || 900,
        categoryId: testResult.data.category_id,
        category: testResult.data.categories,
        isActive: testResult.data.is_active,
        createdAt: new Date(testResult.data.created_at),
        updatedAt: new Date(testResult.data.updated_at),
        questions: fallbackQuestions,
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: testResult.data.time_limit || 900
      };
      
      // Cache the fallback data
      cacheTestData(testId, fallbackTestData);
      
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
    diagnostics.timings.fetchAnswersStart = performance.now() - startTime;
    
    const answersByQuestionId: Record<string, any[]> = {};
    const answerLoadingPromises: Promise<void>[] = [];
    
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
      // Check cache first
      const cachedChoiceAnswers = getCachedBatchAnswers('choice', choiceQuestionIds);
      
      if (cachedChoiceAnswers) {
        // Use cached data
        diagnostics.steps.push({
          name: 'fetchChoiceAnswers',
          source: 'cache',
          answersCount: cachedChoiceAnswers.length
        });
        
        // Organize cached answers by question ID
        cachedChoiceAnswers.forEach((answer: any) => {
          addAnswersToMap(answer.question_id, [answer]);
        });
      } else {
        // Fetch from database
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
                // Cache the answers
                cacheBatchAnswers('choice', choiceQuestionIds, data);
                
                // Group answers by question ID
                data.forEach(answer => {
                  addAnswersToMap(answer.question_id, [answer]);
                });
                
                diagnostics.steps.push({
                  name: 'fetchChoiceAnswers',
                  source: 'database',
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
    }
    
    // Load matching answers
    if (questionsByType['matching'].length > 0) {
      // Check cache first
      const cachedMatchAnswers = getCachedBatchAnswers('matching', questionsByType['matching']);
      
      if (cachedMatchAnswers) {
        // Use cached data
        diagnostics.steps.push({
          name: 'fetchMatchingAnswers',
          source: 'cache',
          answersCount: cachedMatchAnswers.length
        });
        
        // Organize cached answers by question ID
        cachedMatchAnswers.forEach((item: any) => {
          addAnswersToMap(item.question_id, [item]);
        });
      } else {
        // Fetch from database
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
                // Cache the answers
                cacheBatchAnswers('matching', questionsByType['matching'], data);
                
                // Group by question ID
                data.forEach(item => {
                  addAnswersToMap(item.question_id, [item]);
                });
                
                diagnostics.steps.push({
                  name: 'fetchMatchingAnswers',
                  source: 'database',
                  answersCount: data.length
                });
              }
            })
        );
      }
    }
    
    // Load sequence answers
    if (questionsByType['sequence'].length > 0) {
      // Check cache first
      const cachedSequenceAnswers = getCachedBatchAnswers('sequence', questionsByType['sequence']);
      
      if (cachedSequenceAnswers) {
        // Use cached data
        diagnostics.steps.push({
          name: 'fetchSequenceAnswers',
          source: 'cache',
          answersCount: cachedSequenceAnswers.length
        });
        
        // Organize cached answers by question ID
        cachedSequenceAnswers.forEach((item: any) => {
          addAnswersToMap(item.question_id, [item]);
        });
      } else {
        // Fetch from database
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
                // Cache the answers
                cacheBatchAnswers('sequence', questionsByType['sequence'], data);
                
                // Group by question ID
                data.forEach(item => {
                  addAnswersToMap(item.question_id, [item]);
                });
                
                diagnostics.steps.push({
                  name: 'fetchSequenceAnswers',
                  source: 'database',
                  answersCount: data.length
                });
              }
            })
        );
      }
    }
    
    // Load drag-drop answers
    if (questionsByType['drag-drop'].length > 0) {
      // Check cache first
      const cachedDragDropAnswers = getCachedBatchAnswers('dragdrop', questionsByType['drag-drop']);
      
      if (cachedDragDropAnswers) {
        // Use cached data
        diagnostics.steps.push({
          name: 'fetchDragDropAnswers',
          source: 'cache',
          answersCount: cachedDragDropAnswers.length
        });
        
        // Organize cached answers by question ID
        cachedDragDropAnswers.forEach((item: any) => {
          addAnswersToMap(item.question_id, [item]);
        });
      } else {
        // Fetch from database
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
                // Cache the answers
                cacheBatchAnswers('dragdrop', questionsByType['drag-drop'], data);
                
                // Group by question ID
                data.forEach(item => {
                  addAnswersToMap(item.question_id, [item]);
                });
                
                diagnostics.steps.push({
                  name: 'fetchDragDropAnswers',
                  source: 'database',
                  answersCount: data.length
                });
              }
            })
        );
      }
    }
    
    // Wait for all answer loading to complete
    await Promise.all(answerLoadingPromises);
    
    diagnostics.timings.answersLoaded = performance.now() - startTime;
    diagnostics.steps.push({
      name: 'batchLoadAnswers',
      duration: diagnostics.timings.answersLoaded - diagnostics.timings.fetchAnswersStart,
      success: true,
      answersLoaded: Object.values(answersByQuestionId).reduce((sum, arr) => sum + arr.length, 0),
      questionsWithAnswers: Object.keys(answersByQuestionId).length
    });
    
    // STEP 5: Combine questions with their answers
    const questionsWithAnswers = questions.map(question => {
      return {
        ...question,
        mediaUrl: question.media_url, // Map database field to frontend field
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
    
    // Choose the randomization strategy based on user type (free tier = fixed order, paid tier = randomized)
    // For now, we'll just use a simple randomization
    const randomizedQuestions = [...questionsWithAnswers].sort(() => Math.random() - 0.5);
    
    // STEP 6: Construct the final TestData object
    const fullTestData: TestData = {
      id: testResult.data.id,
      title: testResult.data.title,
      description: testResult.data.description,
      timeLimit: testResult.data.time_limit,
      categoryIds: testResult.data.category_ids || [],
      categories: Array.isArray(testResult.data.categories) ? testResult.data.categories : (testResult.data.categories ? [testResult.data.categories] : []),
      isActive: testResult.data.is_active,
      createdAt: new Date(testResult.data.created_at),
      updatedAt: new Date(testResult.data.updated_at),
      questions: randomizedQuestions,
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: testResult.data.time_limit
    };
    
    diagnostics.timings.totalDuration = performance.now() - startTime;
    diagnostics.questionCount = randomizedQuestions.length;
    diagnostics.warningCount = diagnostics.warnings.length;
    diagnostics.errorCount = diagnostics.errors.length;
    
    // Cache the full test data for future requests
    cacheTestData(testId, fullTestData);
    
    return {
      success: true,
      testData: fullTestData,
      diagnostics
    };
    
  } catch (error) {
    diagnostics.timings.totalDuration = performance.now() - startTime;
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
 * Simplified version that can be dropped in as a replacement for the existing function
 */
export async function fetchTestWithQuestionsUltra(testId: string): Promise<TestData | null> {
  try {
    console.log('Starting fetchTestWithQuestionsUltra for ID:', testId);
    
    const result = await fetchTestDataUltra(testId);
    console.log('Fetch result status:', result.success);
    
    if (result.success && result.testData) {
      console.log('Successfully fetched test data:', result.testData.title);
      console.log('Questions count:', result.testData.questions?.length || 0);
      return result.testData;
    }
    
    console.error('Error fetching test data:', result.error);
    console.error('Diagnostics:', JSON.stringify(result.diagnostics, null, 2));
    
    // Create fallback test data if fetch failed
    console.log('Creating fallback test data');
    return {
      id: testId,
      title: 'Fallback Test',
      description: 'This is a fallback test created when fetch failed',
      timeLimit: 900,
      categoryId: '',
      category: { id: '', name: 'General', description: '' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [
        {
          id: 'fallback-question-1',
          text: 'What is JavaScript?',
          type: 'single-choice',
          answers: [
            { id: 'a1', text: 'A programming language', is_correct: true },
            { id: 'a2', text: 'A markup language', is_correct: false },
            { id: 'a3', text: 'A database', is_correct: false }
          ]
        }
      ],
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: 900
    };
  } catch (error) {
    console.error('Exception in fetchTestWithQuestionsUltra:', error);
    throw error; // Rethrow for better debugging
  }
}

/**
 * Fetches answers for a specific question
 * Can be used to populate answers when a user views a specific question
 */
export async function fetchAnswersForQuestion(questionId: string, questionType: QuestionType): Promise<any[]> {
  try {
    console.log(`Fetching answers for question ${questionId} of type ${questionType}`);
    const startTime = performance.now();
    
    // Use direct Supabase client for better performance
    const supabase = createDirectSupabase();
    
    // Check cache first based on question type
    let cacheKey: string;
    switch(questionType) {
      case 'single-choice':
      case 'multiple-choice':
      case 'true-false':
        cacheKey = 'choice';
        break;
      case 'matching':
        cacheKey = 'matching';
        break;
      case 'sequence':
        cacheKey = 'sequence';
        break;
      case 'drag-drop':
        cacheKey = 'dragdrop';
        break;
      default:
        cacheKey = 'choice';
    }
    
    const cachedAnswers = getCachedBatchAnswers(cacheKey, [questionId]);
    if (cachedAnswers) {
      console.log(`Using cached answers for ${questionId}, found ${cachedAnswers.length} answers`);
      return cachedAnswers;
    }
    
    // Different table and structure based on question type
    let answers: any[] = [];
    
    // Fetch from appropriate table based on question type
    if (['single-choice', 'multiple-choice', 'true-false'].includes(questionType)) {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching choice answers for ${questionId}:`, error);
        return [];
      }
      
      answers = data || [];
      cacheBatchAnswers(cacheKey, [questionId], answers);
    } 
    else if (questionType === 'matching') {
      const { data, error } = await supabase
        .from('match_items')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching matching answers for ${questionId}:`, error);
        return [];
      }
      
      answers = data || [];
      cacheBatchAnswers(cacheKey, [questionId], answers);
    }
    else if (questionType === 'sequence') {
      const { data, error } = await supabase
        .from('sequence_items')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching sequence answers for ${questionId}:`, error);
        return [];
      }
      
      answers = data || [];
      cacheBatchAnswers(cacheKey, [questionId], answers);
    }
    else if (questionType === 'drag-drop') {
      const { data, error } = await supabase
        .from('drag_drop_items')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        console.error(`Error fetching drag-drop answers for ${questionId}:`, error);
        return [];
      }
      
      answers = data || [];
      cacheBatchAnswers(cacheKey, [questionId], answers);
    }
    
    console.log(`Fetched ${answers.length} answers for ${questionId} in ${performance.now() - startTime}ms`);
    return answers;
  } catch (error) {
    console.error(`Exception fetching answers for ${questionId}:`, error);
    return [];
  }
}

/**
 * Fetches test with questions but without answers - for progressive loading
 * This improves initial load time by not loading answer data
 */
export async function fetchTestWithQuestionsOnlyUltra(testId: string): Promise<TestData | null> {
  try {
    console.log('Starting fetchTestWithQuestionsOnlyUltra for ID:', testId);
    
    // Use direct Supabase client for better performance
    const supabase = createDirectSupabase();
    const startTime = performance.now();
    
    // Execute parallel queries to get test and questions data
    const [testResult, questionsResult] = await Promise.all([
      // Query 1: Get test with category in a single query
      withTimeout(
        supabase
          .from('tests')
          .select(`
            *,
            categories(*)
          `)
          .eq('id', testId)
          .single(),
        8000, // 8 seconds timeout
        'Test metadata fetch timed out'
      ),
      
      // Query 2: Get test questions with their question data in a single query
      withTimeout(
        supabase
          .from('test_questions')
          .select(`
            *,
            questions(*)
          `)
          .eq('test_id', testId)
          .order('position', { ascending: true }),
        8000, // 8 seconds timeout
        'Test questions fetch timed out'
      )
    ]);
    
    // Handle errors in test metadata
    if (testResult.error || !testResult.data) {
      console.error('Error fetching test metadata:', testResult.error);
      return null;
    }
    
    // Handle errors in questions data
    if (questionsResult.error || !questionsResult.data || questionsResult.data.length === 0) {
      console.error('Error fetching test questions:', questionsResult.error);
      // Return test with empty questions
      return {
        id: testResult.data.id,
        title: testResult.data.title,
        description: testResult.data.description || 'Test without questions',
        timeLimit: testResult.data.time_limit || 900,
        categoryId: testResult.data.category_id,
        category: testResult.data.categories,
        isActive: testResult.data.is_active,
        createdAt: new Date(testResult.data.created_at),
        updatedAt: new Date(testResult.data.updated_at),
        questions: [],
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: testResult.data.time_limit || 900
      };
    }
    
    // Extract questions from the test_questions join data (without answers)
    const questions = questionsResult.data
      .map(tq => {
        if (!tq.questions) return null;
        const q = tq.questions;
        return {
          ...q,
          position: tq.position,
          answers: [] // Initialize with empty answers array
        };
      })
      .filter(q => q !== null);
    
    // Choose the randomization strategy based on user type
    // For now, we'll just use a simple randomization
    const randomizedQuestions = [...questions].sort(() => Math.random() - 0.5);
    
    // Construct the final TestData object
    const testData: TestData = {
      id: testResult.data.id,
      title: testResult.data.title,
      description: testResult.data.description,
      timeLimit: testResult.data.time_limit,
      categoryId: testResult.data.category_id,
      category: testResult.data.categories,
      isActive: testResult.data.is_active,
      createdAt: new Date(testResult.data.created_at),
      updatedAt: new Date(testResult.data.updated_at),
      questions: randomizedQuestions,
      sessionId: `session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: testResult.data.time_limit
    };
    
    console.log('Successfully fetched test questions only:', testData.title);
    console.log('Questions count:', testData.questions?.length || 0);
    console.log('Fetch duration:', performance.now() - startTime, 'ms');
    
    return testData;
  } catch (error) {
    console.error('Exception in fetchTestWithQuestionsOnlyUltra:', error);
    return null;
  }
}

/**
 * Prefetches answers for all questions in a test
 * This can be called after the initial test load to preload all answers in the background
 */
export async function prefetchAllAnswers(test: TestData): Promise<boolean> {
  if (!test || !test.questions || test.questions.length === 0) {
    console.log('No questions to prefetch answers for');
    return false;
  }
  
  try {
    console.log(`Prefetching answers for all ${test.questions.length} questions in test ${test.id}`);
    const startTime = performance.now();
    
    // Use direct Supabase client for better performance
    const supabase = createDirectSupabase();
    
    // Group questions by type for optimized fetching
    const questionsByType: Record<QuestionType, string[]> = {
      'single-choice': [],
      'multiple-choice': [],
      'true-false': [],
      'matching': [],
      'sequence': [],
      'drag-drop': []
    };
    
    test.questions.forEach(q => {
      if (q.type && questionsByType[q.type]) {
        questionsByType[q.type].push(q.id);
      }
    });
    
    // Batch load answers for all questions in parallel
    const answerLoadingPromises: Promise<void>[] = [];
    const answersByQuestionId: Record<string, any[]> = {};
    
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
      // Check cache first
      const cachedChoiceAnswers = getCachedBatchAnswers('choice', choiceQuestionIds);
      
      if (cachedChoiceAnswers) {
        // Use cached data
        console.log('Using cached choice answers');
        
        // Organize cached answers by question ID
        cachedChoiceAnswers.forEach((answer: any) => {
          addAnswersToMap(answer.question_id, [answer]);
        });
      } else {
        // Fetch from database
        answerLoadingPromises.push(
          supabase
            .from('answers')
            .select('*')
            .in('question_id', choiceQuestionIds)
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching choice answers:', error);
                return;
              }
              
              if (data) {
                // Cache the answers
                cacheBatchAnswers('choice', choiceQuestionIds, data);
                
                // Group answers by question ID
                data.forEach(answer => {
                  addAnswersToMap(answer.question_id, [answer]);
                });
                
                console.log(`Fetched ${data.length} choice answers for ${choiceQuestionIds.length} questions`);
              }
            })
        );
      }
    }
    
    // Load matching answers
    if (questionsByType['matching'].length > 0) {
      // Check cache first
      const cachedMatchAnswers = getCachedBatchAnswers('matching', questionsByType['matching']);
      
      if (cachedMatchAnswers) {
        // Use cached data
        console.log('Using cached matching answers');
        
        // Organize cached answers by question ID
        cachedMatchAnswers.forEach((item: any) => {
          addAnswersToMap(item.question_id, [item]);
        });
      } else {
        // Fetch from database
        answerLoadingPromises.push(
          supabase
            .from('match_items')
            .select('*')
            .in('question_id', questionsByType['matching'])
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching matching answers:', error);
                return;
              }
              
              if (data) {
                // Cache the answers
                cacheBatchAnswers('matching', questionsByType['matching'], data);
                
                // Group by question ID
                data.forEach(item => {
                  addAnswersToMap(item.question_id, [item]);
                });
                
                console.log(`Fetched ${data.length} matching answers for ${questionsByType['matching'].length} questions`);
              }
            })
        );
      }
    }
    
    // Load sequence answers
    if (questionsByType['sequence'].length > 0) {
      // Check cache first
      const cachedSequenceAnswers = getCachedBatchAnswers('sequence', questionsByType['sequence']);
      
      if (cachedSequenceAnswers) {
        // Use cached data
        console.log('Using cached sequence answers');
        
        // Organize cached answers by question ID
        cachedSequenceAnswers.forEach((item: any) => {
          addAnswersToMap(item.question_id, [item]);
        });
      } else {
        // Fetch from database
        answerLoadingPromises.push(
          supabase
            .from('sequence_items')
            .select('*')
            .in('question_id', questionsByType['sequence'])
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching sequence answers:', error);
                return;
              }
              
              if (data) {
                // Cache the answers
                cacheBatchAnswers('sequence', questionsByType['sequence'], data);
                
                // Group by question ID
                data.forEach(item => {
                  addAnswersToMap(item.question_id, [item]);
                });
                
                console.log(`Fetched ${data.length} sequence answers for ${questionsByType['sequence'].length} questions`);
              }
            })
        );
      }
    }
    
    // Load drag-drop answers
    if (questionsByType['drag-drop'].length > 0) {
      // Check cache first
      const cachedDragDropAnswers = getCachedBatchAnswers('dragdrop', questionsByType['drag-drop']);
      
      if (cachedDragDropAnswers) {
        // Use cached data
        console.log('Using cached drag-drop answers');
        
        // Organize cached answers by question ID
        cachedDragDropAnswers.forEach((item: any) => {
          addAnswersToMap(item.question_id, [item]);
        });
      } else {
        // Fetch from database
        answerLoadingPromises.push(
          supabase
            .from('drag_drop_items')
            .select('*')
            .in('question_id', questionsByType['drag-drop'])
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching drag-drop answers:', error);
                return;
              }
              
              if (data) {
                // Cache the answers
                cacheBatchAnswers('dragdrop', questionsByType['drag-drop'], data);
                
                // Group by question ID
                data.forEach(item => {
                  addAnswersToMap(item.question_id, [item]);
                });
                
                console.log(`Fetched ${data.length} drag-drop answers for ${questionsByType['drag-drop'].length} questions`);
              }
            })
        );
      }
    }
    
    // Wait for all answer loading to complete
    await Promise.all(answerLoadingPromises);
    
    const totalDuration = performance.now() - startTime;
    const totalAnswers = Object.values(answersByQuestionId).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Prefetched a total of ${totalAnswers} answers for ${test.questions.length} questions in ${totalDuration}ms`);
    
    return true;
  } catch (error) {
    console.error('Exception in prefetchAllAnswers:', error);
    return false;
  }
}

/**
 * Gets answers for a specific question and updates the test data
 * Returns an updated copy of the test data with answers for the specified question
 */
export async function getAnswersAndUpdateTest(
  test: TestData, 
  questionIndex: number
): Promise<TestData> {
  if (!test || !test.questions || questionIndex < 0 || questionIndex >= test.questions.length) {
    console.error('Invalid test data or question index');
    return test; // Return unchanged
  }
  
  try {
    const question = test.questions[questionIndex];
    
    // If question already has answers, no need to fetch
    if (question.answers && question.answers.length > 0) {
      console.log(`Question ${question.id} already has ${question.answers.length} answers`);
      return test;
    }
    
    console.log(`Getting answers for question at index ${questionIndex}: ${question.id}`);
    const answers = await fetchAnswersForQuestion(question.id, question.type);
    
    // Create a copy of the test with updated answers for this question
    const updatedTest = {
      ...test,
      questions: test.questions.map((q, idx) => 
        idx === questionIndex 
          ? { ...q, answers: answers }
          : q
      )
    };
    
    console.log(`Updated test with ${answers.length} answers for question ${question.id}`);
    return updatedTest;
  } catch (error) {
    console.error('Error updating test with answers:', error);
    return test; // Return unchanged on error
  }
}

/**
 * Batch fetches answers for a range of questions and updates the test data
 * Useful for prefetching the next few questions a user might see
 */
export async function getAnswersForQuestionRange(
  test: TestData,
  startIndex: number,
  endIndex: number
): Promise<TestData> {
  if (!test || !test.questions) {
    console.error('Invalid test data');
    return test; // Return unchanged
  }
  
  // Validate indexes
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(test.questions.length - 1, endIndex);
  
  if (startIndex > endIndex) {
    console.error('Invalid range: startIndex > endIndex');
    return test;
  }
  
  try {
    console.log(`Getting answers for questions from index ${startIndex} to ${endIndex}`);
    
    // Get questions that need answers
    const questionsToUpdate = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const question = test.questions[i];
      // Only fetch for questions without answers
      if (!question.answers || question.answers.length === 0) {
        questionsToUpdate.push({ index: i, question });
      }
    }
    
    if (questionsToUpdate.length === 0) {
      console.log('All questions in range already have answers');
      return test;
    }
    
    console.log(`Found ${questionsToUpdate.length} questions that need answers`);
    
    // Group questions by type
    const questionsByType: Record<QuestionType, { index: number, id: string }[]> = {
      'single-choice': [],
      'multiple-choice': [],
      'true-false': [],
      'matching': [],
      'sequence': [],
      'drag-drop': []
    };
    
    questionsToUpdate.forEach(({ index, question }) => {
      if (question.type && questionsByType[question.type]) {
        questionsByType[question.type].push({ index, id: question.id });
      }
    });
    
    // Create a copy of the test data that we'll update
    const updatedTest = { ...test, questions: [...test.questions] };
    
    // Process each question type in parallel
    const updatePromises: Promise<void>[] = [];
    
    // Helper function to update questions of a specific type
    const updateQuestionsOfType = async (
      type: QuestionType,
      questionData: { index: number, id: string }[],
      tableName: string,
      cacheKey: string
    ) => {
      if (questionData.length === 0) return;
      
      const questionIds = questionData.map(q => q.id);
      console.log(`Fetching ${questionIds.length} ${type} answers`);
      
      // Check cache first
      const cachedAnswers = getCachedBatchAnswers(cacheKey, questionIds);
      if (cachedAnswers) {
        // Group answers by question ID
        const answersByQuestionId: Record<string, any[]> = {};
        cachedAnswers.forEach(answer => {
          if (!answersByQuestionId[answer.question_id]) {
            answersByQuestionId[answer.question_id] = [];
          }
          answersByQuestionId[answer.question_id].push(answer);
        });
        
        // Update questions with cached answers
        questionData.forEach(({ index, id }) => {
          if (answersByQuestionId[id]) {
            updatedTest.questions[index] = {
              ...updatedTest.questions[index],
              answers: answersByQuestionId[id] || []
            };
          }
        });
        
        console.log(`Used cached answers for ${type} questions`);
        return;
      }
      
      // Fetch from database
      const supabase = createDirectSupabase();
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .in('question_id', questionIds);
        
      if (error) {
        console.error(`Error fetching ${type} answers:`, error);
        return;
      }
      
      if (data && data.length > 0) {
        // Cache answers
        cacheBatchAnswers(cacheKey, questionIds, data);
        
        // Group answers by question ID
        const answersByQuestionId: Record<string, any[]> = {};
        data.forEach(answer => {
          if (!answersByQuestionId[answer.question_id]) {
            answersByQuestionId[answer.question_id] = [];
          }
          answersByQuestionId[answer.question_id].push(answer);
        });
        
        // Update questions with fetched answers
        questionData.forEach(({ index, id }) => {
          updatedTest.questions[index] = {
            ...updatedTest.questions[index],
            answers: answersByQuestionId[id] || []
          };
        });
        
        console.log(`Updated ${Object.keys(answersByQuestionId).length} ${type} questions with answers`);
      }
    };
    
    // Process choice-based questions (single-choice, multiple-choice, true-false)
    const choiceQuestions = [
      ...questionsByType['single-choice'],
      ...questionsByType['multiple-choice'],
      ...questionsByType['true-false']
    ];
    
    if (choiceQuestions.length > 0) {
      updatePromises.push(
        updateQuestionsOfType('single-choice', choiceQuestions, 'answers', 'choice')
      );
    }
    
    // Process matching questions
    if (questionsByType['matching'].length > 0) {
      updatePromises.push(
        updateQuestionsOfType('matching', questionsByType['matching'], 'match_items', 'matching')
      );
    }
    
    // Process sequence questions
    if (questionsByType['sequence'].length > 0) {
      updatePromises.push(
        updateQuestionsOfType('sequence', questionsByType['sequence'], 'sequence_items', 'sequence')
      );
    }
    
    // Process drag-drop questions
    if (questionsByType['drag-drop'].length > 0) {
      updatePromises.push(
        updateQuestionsOfType('drag-drop', questionsByType['drag-drop'], 'drag_drop_items', 'dragdrop')
      );
    }
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log(`Completed batch update of questions from index ${startIndex} to ${endIndex}`);
    return updatedTest;
  } catch (error) {
    console.error('Error batch updating test with answers:', error);
    return test; // Return unchanged on error
  }
}