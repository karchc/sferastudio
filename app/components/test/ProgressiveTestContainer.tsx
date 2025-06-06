'use client';

import { useState, useEffect } from 'react';
import { TestData, Question } from '@/app/lib/types';
import { fetchTestWithQuestionsUltra } from '@/app/lib/ultra-optimized-test-fetcher';
import { Timer } from './Timer';
import OptimizedQuestionCard from './OptimizedQuestionCard';
import { QuestionNavigation } from './QuestionNavigation';
import { TestStartScreen } from './TestStartScreen';
import { TestSummary } from './TestSummary';

interface ProgressiveTestContainerProps {
  testId: string;
}

export default function ProgressiveTestContainer({ testId }: ProgressiveTestContainerProps) {
  // Test data and loading state
  const [testData, setTestData] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Test session state
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Effects for data loading and initialization
  useEffect(() => {
    let isMounted = true;
    let loadingTimer: NodeJS.Timeout;
    
    // Simulate incremental loading progress
    loadingTimer = setInterval(() => {
      setLoadingProgress(prev => {
        const increment = Math.random() * 10;
        const newProgress = Math.min(prev + increment, 95);
        return newProgress;
      });
    }, 300);
    
    // STEP 1: Load test data
    const loadTestData = async () => {
      try {
        console.log('Starting to load test data for ID:', testId);
        
        // Fetch test data with error handling
        let data;
        try {
          data = await fetchTestWithQuestionsUltra(testId);
          console.log('Test data fetch completed:', data ? 'success' : 'failed');
        } catch (fetchError) {
          console.error('Error caught during test fetch:', fetchError);
          setError(`Error fetching test: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
          setIsLoading(false);
          clearInterval(loadingTimer);
          return;
        }
        
        if (!isMounted) return;
        
        if (!data) {
          console.error('No data returned from test fetch');
          setError('Failed to load test data - null response from fetch');
          setIsLoading(false);
          clearInterval(loadingTimer);
          return;
        }
        
        // STEP 2: First set basic test metadata so we can show that immediately
        setTestData(prevData => {
          if (prevData) return prevData;
          
          return {
            id: data.id,
            title: data.title,
            description: data.description,
            timeLimit: data.timeLimit,
            categoryIds: data.categoryIds,
            categories: data.categories,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            sessionId: data.sessionId,
            startTime: data.startTime,
            timeRemaining: data.timeLimit,
            questions: [], // Empty initially
          };
        });
        
        setIsMetadataLoaded(true);
        setTimeRemaining(data.timeLimit);
        
        // STEP 3: Start progressively loading questions - this creates a smoother UX feel
        const allQuestions = data.questions || [];
        const chunkSize = Math.max(2, Math.ceil(allQuestions.length / 3)); // Load in 3 chunks, min 2 questions
        
        // Load first chunk immediately
        const firstChunk = allQuestions.slice(0, chunkSize);
        setLoadedQuestions(firstChunk);
        
        // Load remaining chunks with small delays
        setTimeout(() => {
          if (!isMounted) return;
          const secondChunk = allQuestions.slice(0, chunkSize * 2);
          setLoadedQuestions(secondChunk);
          
          setTimeout(() => {
            if (!isMounted) return;
            setLoadedQuestions(allQuestions);
            
            // Finally update the full test data and finish loading
            setTestData(data);
            setIsLoading(false);
            setLoadingProgress(100);
            clearInterval(loadingTimer);
          }, 300);
        }, 200);
        
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading test data:', err);
        setError('An error occurred while loading the test');
        setIsLoading(false);
        clearInterval(loadingTimer);
      }
    };
    
    loadTestData();
    
    return () => {
      isMounted = false;
      clearInterval(loadingTimer);
    };
  }, [testId]);
  
  // Handle start test
  const handleStartTest = () => {
    setHasStarted(true);
    setTimeRemaining(testData?.timeLimit || 900);
  };
  
  // Handle test completion
  const handleCompleteTest = () => {
    setIsComplete(true);
    // Normally you would save the test results to the server here
  };
  
  
  // Handle question navigation
  const handleNavigateQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };
  
  // Handle answer change
  const handleAnswerChange = (questionId: string, answerData: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerData
    }));
  };
  
  
  // Render loading state or error
  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-300 rounded p-4 flex flex-col items-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Test</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Skeleton loader for the test screen
  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {isMetadataLoaded && testData ? (
            <>
              <h1 className="text-2xl font-bold mb-2">{testData.title || "Loading test..."}</h1>
              <p className="text-gray-600 mb-2">{testData.description || "Please wait while we prepare your test."}</p>
              {testData.categories?.[0] && (
                <div className="text-sm text-blue-600 mb-4">
                  Category: {testData.categories[0].name}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-3 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-1/4"></div>
            </>
          )}
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}>
            </div>
          </div>
          
          <div className="space-y-4">
            {loadedQuestions.length > 0 ? (
              <div className="mb-6">
                <div className="font-semibold text-green-600 mb-2">
                  Loaded {loadedQuestions.length} questions
                </div>
                <div className="grid grid-cols-8 gap-1 mb-4">
                  {Array.from({ length: testData?.questions?.length || 20 }).map((_, i) => (
                    <div 
                      key={`skeleton-nav-${i}`}
                      className={`h-8 w-8 flex items-center justify-center rounded-full text-sm
                        ${i < loadedQuestions.length ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="h-64 bg-gray-100 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={`skeleton-nav-${i}`}
                      className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"
                    ></div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Test start screen
  if (!hasStarted) {
    return <TestStartScreen test={testData!} onStart={handleStartTest} />;
  }
  
  // Test completion screen
  if (isComplete) {
    return (
      <TestSummary 
        test={testData!} 
        userAnswers={Object.entries(userAnswers).map(([questionId, data]) => ({
          questionId,
          answerId: Array.isArray(data?.selectedIds) ? data.selectedIds : 
                   data?.selectedId ? [data.selectedId] : []
        }))}
        timeSpent={(testData?.timeLimit || 0) - (timeRemaining || 0)}
        onRetry={() => window.location.reload()}
        onViewDashboard={() => window.location.href = '/dashboard'}
      />
    );
  }
  
  // Ensure questions are loaded
  const questions = testData?.questions || [];
  if (questions.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-300 rounded p-4">
          <h2 className="text-xl font-bold text-yellow-700 mb-2">No Questions Available</h2>
          <p className="text-yellow-600">This test doesn't have any questions yet.</p>
        </div>
      </div>
    );
  }
  
  // Main test interface
  const currentQuestion = questions[currentQuestionIndex];
  const hasUserAnswered = !!userAnswers[currentQuestion.id];
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{testData?.title}</h1>
          {timeRemaining !== null && (
            <Timer 
              initialTime={testData?.timeLimit || 900} 
              onTimeUp={handleCompleteTest}
            />
          )}
        </div>
        
        <OptimizedQuestionCard
          question={currentQuestion}
          onChange={(answerData) => handleAnswerChange(currentQuestion.id, answerData)}
          userAnswer={userAnswers[currentQuestion.id]}
        />
      </div>
      
      <QuestionNavigation
        currentIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        onNavigate={handleNavigateQuestion}
        userAnswers={Object.entries(userAnswers).map(([questionId, data]) => ({
          questionId,
          answerId: Array.isArray(data?.selectedIds) ? data.selectedIds : 
                   data?.selectedId ? [data.selectedId] : []
        }))}
        questionIds={questions.map(q => q.id)}
      />
    </div>
  );
}