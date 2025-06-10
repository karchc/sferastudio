'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientSupabase } from '../supabase';
import { TestData, Question } from '../lib/types';

// Components
import PrepQuestionCard from '../components/test/PrepQuestionCard';
import PrepTestContainer from '../components/test/PrepTestContainer';
import PrepTestStartScreen from '../components/test/PrepTestStartScreen';
import PrepTimer from '../components/test/PrepTimer';
import PrepTestSummary from '../components/test/PrepTestSummary';

export default function PrepExamPage() {
  const router = useRouter();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);

        // First try to fetch mock data from our debug endpoint
        try {
          const mockResponse = await fetch('/api/debug-prep/simple');
          const mockData = await mockResponse.json();
          
          if (mockResponse.ok && mockData.success && mockData.mockTest) {
            console.log('Using mock test data for development');
            setTestData(mockData.mockTest);
            setTimeRemaining(mockData.mockTest.timeLimit);
            setLoading(false);
            return; // Exit early if we successfully got mock data
          }
        } catch (mockError) {
          console.error('Failed to fetch mock data:', mockError);
          // Continue to try the real data fetching
        }
        
        const supabase = createClientSupabase();
        
        // First, get test metadata
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select(`
            *,
            categories(*)
          `)
          .eq('is_active', true)
          .limit(1)
          .single();
          
        if (testError || !testData) {
          throw new Error(testError?.message || 'Failed to fetch test data');
        }

        // Next, get all test questions
        const { data: testQuestions, error: questionsError } = await supabase
          .from('test_questions')
          .select('*, questions(*)')
          .eq('test_id', testData.id)
          .order('position', { ascending: true });

        console.log('Test questions response:', { 
          hasError: !!questionsError, 
          errorMsg: questionsError?.message,
          questionCount: testQuestions?.length || 0,
          sampleQuestion: testQuestions && testQuestions.length > 0 ? 
            JSON.stringify(testQuestions[0]).substring(0, 200) + '...' : 'No questions'
        });

        if (questionsError || !testQuestions || testQuestions.length === 0) {
          throw new Error(questionsError?.message || 'No questions found for this test');
        }

        // Extract questions from test_questions join data
        console.log('First test question structure:', testQuestions[0]);
        
        // See if the join worked
        let questions: Question[] = [];
        
        if (testQuestions[0]?.questions) {
          // Join worked as expected
          questions = testQuestions
            .map(tq => tq.questions ? 
              { ...tq.questions, position: tq.position } : null)
            .filter(q => q !== null) as Question[];
        } else {
          // Join didn't work, fetch questions individually
          console.log("Join didn't work, fetching questions separately");
          
          // Get question IDs from test_questions
          const questionIds = testQuestions.map(tq => tq.question_id);
          
          // Fetch questions by their IDs
          const { data: questionsData, error: fetchError } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds);
            
          if (fetchError || !questionsData) {
            console.error('Error fetching questions by ID:', fetchError);
            throw new Error('Failed to fetch questions data');
          }
          
          // Map questions with their positions from test_questions
          questions = questionsData.map(q => {
            const tq = testQuestions.find(t => t.question_id === q.id);
            return {
              ...q,
              position: tq?.position || 0
            };
          });
        }
        
        console.log('Extracted questions count:', questions.length);

        // Get question IDs for batch fetching answers
        const questionIds = questions.map(q => q.id);

        // Group questions by type for optimized answer loading
        const questionsByType: Record<string, string[]> = {
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

        // Batch load answers for all questions in parallel
        const [
          choiceAnswersResult, 
          matchItemsResult, 
          sequenceItemsResult, 
          dragDropItemsResult
        ] = await Promise.all([
          // Fetch all choice answers
          supabase
            .from('answers')
            .select('*')
            .in('question_id', [...questionsByType['single-choice'], 
                               ...questionsByType['multiple-choice'], 
                               ...questionsByType['true-false']]),
            
          // Fetch all match items
          supabase
            .from('match_items')
            .select('*')
            .in('question_id', questionsByType['matching']),
            
          // Fetch all sequence items
          supabase
            .from('sequence_items')
            .select('*')
            .in('question_id', questionsByType['sequence']),
            
          // Fetch all drag-drop items
          supabase
            .from('drag_drop_items')
            .select('*')
            .in('question_id', questionsByType['drag-drop'])
        ]);

        // Organize answers by question ID
        const answersByQuestionId: Record<string, any[]> = {};
        
        const addAnswersToMap = (data: any[] | null, questionIds: string[]) => {
          if (!data) return;
          
          data.forEach(item => {
            if (!answersByQuestionId[item.question_id]) {
              answersByQuestionId[item.question_id] = [];
            }
            answersByQuestionId[item.question_id].push(item);
          });
        };

        addAnswersToMap(choiceAnswersResult.data, [
          ...questionsByType['single-choice'], 
          ...questionsByType['multiple-choice'], 
          ...questionsByType['true-false']
        ]);
        addAnswersToMap(matchItemsResult.data, questionsByType['matching']);
        addAnswersToMap(sequenceItemsResult.data, questionsByType['sequence']);
        addAnswersToMap(dragDropItemsResult.data, questionsByType['drag-drop']);

        // Combine questions with their answers
        const questionsWithAnswers = questions.map(question => ({
          ...question,
          answers: answersByQuestionId[question.id] || []
        }));

        // Construct the final TestData object
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
          questions: questionsWithAnswers,
          sessionId: `session-${Date.now()}`,
          startTime: new Date(),
          timeRemaining: testData.time_limit
        };

        console.log('Fetched test data:', {
          testId: testData.id, 
          testTitle: testData.title,
          questionCount: questionsWithAnswers.length,
          questionsWithAnswers: questionsWithAnswers.map(q => ({
            id: q.id,
            type: q.type,
            text: q.text.substring(0, 30) + '...',
            answerCount: q.answers.length
          }))
        });
        
        setTestData(fullTestData);
        setTimeRemaining(testData.time_limit);
      } catch (err) {
        console.error('Error fetching exam data:', err);
        const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMsg);
        setDebugInfo({
          error: errorMsg,
          errorObject: err,
          testId: testData?.id,
          testTitle: testData?.title
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, []);

  const handleStart = () => {
    setStarted(true);
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  const handleNextQuestion = () => {
    if (!testData || currentQuestionIndex >= testData.questions.length - 1) {
      handleComplete();
      return;
    }
    setCurrentQuestionIndex(prevIndex => prevIndex + 1);
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleAnswerSelect = (questionId: string, answerData: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerData
    }));
  };

  const handleTimeUpdate = (timeRemaining: number) => {
    setTimeRemaining(timeRemaining);
    if (testData) {
      setTestData(prev => prev ? {...prev, timeRemaining} : null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Prep Exam...</h1>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Exam</h1>
          <p className="text-red-500">{error}</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto max-w-full max-h-60">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          <button 
            onClick={() => {
              // Attempt to load basic test data directly for debugging
              const fetchDirectData = async () => {
                try {
                  const supabase = createClientSupabase();
                  const { data, error } = await supabase.from('tests').select('*').limit(1);
                  setDebugInfo({ direct_fetch: data, error });
                } catch (err) {
                  setDebugInfo({ direct_fetch_error: err });
                }
              };
              fetchDirectData();
            }}
            className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
          >
            Debug: Fetch Direct
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Exam Available</h1>
          <p>Sorry, there are no active exams available at this time.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return <PrepTestStartScreen test={testData} onStart={handleStart} />;
  }

  if (completed) {
    return (
      <PrepTestSummary 
        test={testData} 
        answers={answers} 
        timeSpent={testData.timeLimit - timeRemaining}
      />
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];

  return (
    <PrepTestContainer
      title={testData.title}
      questionCount={testData.questions.length}
      currentIndex={currentQuestionIndex}
      onNext={handleNextQuestion}
      onPrev={handlePrevQuestion}
      onComplete={handleComplete}
      allowBackwardNavigation={testData.allow_backward_navigation ?? true}
    >
      <div className="mb-4">
        <PrepTimer 
          initialTime={testData.timeLimit} 
          onTimeUpdate={handleTimeUpdate}
          onTimeExpired={handleComplete}
        />
      </div>
      
      {currentQuestion && (
        <PrepQuestionCard
          question={currentQuestion}
          onAnswerSelect={(answerData) => handleAnswerSelect(currentQuestion.id, answerData)}
          selectedAnswer={answers[currentQuestion.id] || null}
          showFeedback={false}
        />
      )}
    </PrepTestContainer>
  );
}