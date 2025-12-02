"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/app/supabase";
import { createDirectSupabase } from "@/app/lib/direct-supabase";
import { TestData, Question, DragDropItem } from "@/app/lib/types";
import { withTimeout } from "@/app/lib/fetch-utils";
import { getHardcodedTestData, getHardcodedQuestions } from "@/app/lib/test-debugger-utils";
import { fetchTestWithQuestionsUltra } from "@/app/lib/ultra-optimized-test-fetcher";
import Image from "next/image";

// Format seconds to MM:SS
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function TestExamPage() {
  const [status, setStatus] = useState("Loading...");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [error, setError] = useState<any>(null);
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{[questionId: string]: string[]}>({});
  const [dragItems, setDragItems] = useState<DragDropItem[]>([]);
  const [dropZones, setDropZones] = useState<string[]>([]);
  const [itemPlacements, setItemPlacements] = useState<{[itemId: string]: string}>({});
  const [matchingAnswers, setMatchingAnswers] = useState<{[questionId: string]: {[leftId: string]: string}}>({});
  const [sequenceAnswers, setSequenceAnswers] = useState<{[questionId: string]: {[itemId: string]: number}}>({});
  const draggedItem = useRef<string | null>(null);
  
  // Format current date like "May 16 2025"
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Mock username
  const username = "Sample";
  
  // Initialize drag and drop data based on the current question
  useEffect(() => {
    if (currentQuestion?.type === 'drag-drop' && currentQuestion.answers) {
      // Extract unique target zones from the drag drop items
      const dragDropItems = currentQuestion.answers as DragDropItem[];
      const zones = Array.from(new Set(dragDropItems.map(item => item.target_zone || item.targetZone)));
      setDropZones(zones);
      
      // Set drag items using the DragDropItem interface
      setDragItems(dragDropItems);
      
      // Reset placements
      setItemPlacements({});
    }
  }, [currentQuestion]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setStatus("Fetching test data...");
        
        // Create Supabase clients
        const supabase = createClientSupabase();
        const directClient = createDirectSupabase();
        
        // Test ID to fetch (using the one from debug page)
        const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
        
        console.log("Attempting to fetch test data with ultra optimized fetcher...");
        try {
          // First try to fetch from database using the ultra optimized fetcher
          const fetchedTestData = await fetchTestWithQuestionsUltra(testId);
          console.log("Fetched test data:", fetchedTestData); // DEBUG LOG
          if (fetchedTestData && fetchedTestData.questions && fetchedTestData.questions.length > 0) {
            console.log("Test data fetched successfully from database");
            console.log("Questions found:", fetchedTestData.questions.length);
            
            setTestData(fetchedTestData);
            setTimeRemaining(fetchedTestData.timeLimit);
            setCurrentQuestion(fetchedTestData.questions[0]);
            setStatus("Test data loaded successfully from database");
            return;
          }
          
          console.log("Database fetch returned no questions, trying direct client fallback...");
          
          // Fallback: fetch test metadata and use hardcoded questions
          const testResponse = await withTimeout(
            directClient
              .from('tests')
              .select('*, categories(*)')
              .eq('id', testId)
              .single(),
            8000, // 8 seconds timeout
            'Test data fetch timed out'
          );
          
          if (testResponse.error) {
            console.error("Error fetching test with direct client:", testResponse.error);
            throw new Error(testResponse.error.message);
          }
          
          console.log("Test metadata fetched, using hardcoded questions as fallback");
          
          // Get hardcoded questions as fallback
          const questions = getHardcodedQuestions(testId);
          
          // Create test data object with hardcoded questions
          const testData: TestData = {
            id: testResponse.data.id,
            title: testResponse.data.title,
            description: testResponse.data.description || "",
            timeLimit: testResponse.data.time_limit,
            categoryId: testResponse.data.category_id,
            category: testResponse.data.categories,
            isActive: testResponse.data.is_active,
            createdAt: new Date(testResponse.data.created_at),
            updatedAt: new Date(testResponse.data.updated_at),
            questions: questions,
            sessionId: `session-${Date.now()}`,
            startTime: new Date(),
            timeRemaining: testResponse.data.time_limit
          };
          
          setTestData(testData);
          setTimeRemaining(testData.timeLimit);
          if (questions.length > 0) {
            setCurrentQuestion(questions[0]);
          }
          setStatus("Test data loaded successfully with hardcoded fallback");
          return;
        } catch (directError) {
          console.error("Direct client fetch failed, trying with regular client...");
          
          try {
            // Try the regular client as a fallback
            const fallbackResponse = await supabase
              .from('tests')
              .select('*, categories(*)')
              .eq('id', testId)
              .single();
              
            if (fallbackResponse.error) {
              console.error("Error fetching test with regular client:", fallbackResponse.error);
              throw new Error(fallbackResponse.error.message);
            }
            
            console.log("Test data fetched successfully with regular client");
            
            // Get hardcoded questions for the demo
            const questions = getHardcodedQuestions(testId);
            
            // Create test data object with hardcoded questions
            const testData: TestData = {
              id: fallbackResponse.data.id,
              title: fallbackResponse.data.title,
              description: fallbackResponse.data.description || "",
              timeLimit: fallbackResponse.data.time_limit,
              categoryId: fallbackResponse.data.category_id,
              category: fallbackResponse.data.categories,
              isActive: fallbackResponse.data.is_active,
              createdAt: new Date(fallbackResponse.data.created_at),
              updatedAt: new Date(fallbackResponse.data.updated_at),
              questions: questions,
              sessionId: `session-${Date.now()}`,
              startTime: new Date(),
              timeRemaining: fallbackResponse.data.time_limit
            };
            
            setTestData(testData);
            setTimeRemaining(testData.timeLimit);
            if (questions.length > 0) {
              setCurrentQuestion(questions[0]);
            }
            setStatus("Test data loaded successfully");
            return;
          } catch (fallbackError) {
            console.error("Both clients failed, trying hardcoded test data...");
            
            // Try to use hardcoded data from test-debugger-utils
            const hardcodedTest = getHardcodedTestData(testId);
            const hardcodedQuestions = getHardcodedQuestions(testId);
            
            if (hardcodedTest) {
              console.log("Using hardcoded test data");
              
              // Add questions to test data
              hardcodedTest.questions = hardcodedQuestions;
              
              setTestData(hardcodedTest);
              setTimeRemaining(hardcodedTest.timeLimit);
              if (hardcodedQuestions.length > 0) {
                setCurrentQuestion(hardcodedQuestions[0]);
              }
              setStatus("Using hardcoded test data");
              return;
            }
            
            // If hardcoded data also fails, create a minimal default test
            console.error("All data sources failed, using default test data");
            
            // Create default question
            const defaultQuestion: Question = {
              id: 'default-q1',
              text: 'Which of the following is NOT a JavaScript data type?',
              type: 'multiple-choice',
              position: 1,
              categoryId: 'default-category',
              answers: [
                { id: 'a1', questionId: 'default-q1', text: 'String', isCorrect: false },
                { id: 'a2', questionId: 'default-q1', text: 'Number', isCorrect: false },
                { id: 'a3', questionId: 'default-q1', text: 'Boolean', isCorrect: false },
                { id: 'a4', questionId: 'default-q1', text: 'Character', isCorrect: true }
              ]
            };
            
            // Use default data as last resort
            const defaultTestData: TestData = {
              id: 'default-test-id',
              title: 'JavaScript Basics (Default)',
              description: 'This is a default test that appears when the database connection fails.',
              timeLimit: 1800, // 30 minutes
              categoryId: 'default-category',
              category: {
                id: 'default-category',
                name: 'Programming',
                description: 'Programming fundamentals'
              },
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              questions: [defaultQuestion],
              sessionId: `session-${Date.now()}`,
              startTime: new Date(),
              timeRemaining: 1800
            };
            
            setTestData(defaultTestData);
            setTimeRemaining(defaultTestData.timeLimit);
            setCurrentQuestion(defaultQuestion);
            setStatus("Using default test data");
          }
        }
      } catch (e) {
        console.error("Unhandled error in fetchTest:", e);
        setError(e);
        setStatus("Error fetching test data");
      }
    };
    
    fetchTest();
  }, []);
  
  // Timer effect
  useEffect(() => {
    if (!testData || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [testData, timeRemaining]);
  
  // Handle answer selection
  const handleAnswerSelect = (answerId: string) => {
    if (!currentQuestion) return;
    
    const questionId = currentQuestion.id;
    
    if (currentQuestion.type === 'multiple-choice') {
      // For multiple choice, toggle the answer
      setSelectedAnswers(prev => {
        const current = prev[questionId] || [];
        return {
          ...prev,
          [questionId]: current.includes(answerId)
            ? current.filter(id => id !== answerId)
            : [...current, answerId]
        };
      });
    } else {
      // For single choice, true/false, replace the answer
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: [answerId]
      }));
    }
  };

  // Handle matching question selection
  const handleMatchingSelect = (leftId: string, rightText: string) => {
    if (!currentQuestion) return;
    
    const questionId = currentQuestion.id;
    setMatchingAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [leftId]: rightText
      }
    }));
  };

  // Handle sequence question selection
  const handleSequenceSelect = (itemId: string, position: number) => {
    if (!currentQuestion) return;
    
    const questionId = currentQuestion.id;
    setSequenceAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [itemId]: position
      }
    }));
  };
  
  // Navigate to next question
  const goToNextQuestion = () => {
    if (!testData || !testData.questions) return;
    
    const nextIndex = questionIndex + 1;
    if (nextIndex < testData.questions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(testData.questions[nextIndex]);
    }
  };

  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (!testData || !testData.questions) return;
    
    const prevIndex = questionIndex - 1;
    if (prevIndex >= 0) {
      setQuestionIndex(prevIndex);
      setCurrentQuestion(testData.questions[prevIndex]);
    }
  };

  // Navigate to specific question
  const goToQuestion = (index: number) => {
    if (!testData || !testData.questions || index < 0 || index >= testData.questions.length) return;
    
    setQuestionIndex(index);
    setCurrentQuestion(testData.questions[index]);
  };
  
  // Check if an answer is selected
  const isAnswerSelected = (answerId: string) => {
    if (!currentQuestion) return false;
    const selected = selectedAnswers[currentQuestion.id] || [];
    return selected.includes(answerId);
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    draggedItem.current = itemId;
    e.currentTarget.classList.add('opacity-50');
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    draggedItem.current = null;
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, zoneId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');
    
    if (draggedItem.current) {
      setItemPlacements(prev => ({
        ...prev,
        [draggedItem.current!]: zoneId
      }));
    }
  };
  
  // Check if an item is in a specific drop zone
  const isItemInZone = (itemId: string, zoneId: string) => {
    return itemPlacements[itemId] === zoneId;
  };
  
  // Get items in a specific drop zone
  const getItemsInZone = (zoneId: string) => {
    return dragItems
      .filter(item => itemPlacements[item.id] === zoneId)
      .sort((a, b) => a.content.localeCompare(b.content));
  };
  
  // Get items not yet placed in any zone
  const getUnplacedItems = () => {
    return dragItems
      .filter(item => !itemPlacements[item.id])
      .sort((a, b) => a.content.localeCompare(b.content));
  };

  if (error) {
    return (
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Test</h2>
          <p className="mb-6">Unable to load test data. Please try again later or contact support.</p>
          <pre className="text-left bg-red-50 p-4 rounded mb-6 overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </main>
    );
  }
  
  if (!testData || !currentQuestion) {
    return (
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                  Loading...
                </span>
              </div>
              <p className="mt-4 text-lg">{status}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-8 relative">
              <Image 
                src="/practice_sap_logo_cropped.png"
                alt="Practice ERP Logo"
                width={100}
                height={32}
                priority
                className="object-contain"
              />
            </div>
          </div>
          <div className="text-right text-sm">
            <span className="block">: {currentDate}</span>
            <span className="block">: {username}</span>
          </div>
        </div>
      </header>
      
      {/* Timer Bar */}
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="font-medium text-gray-700">
            Time remaining: {formatTime(timeRemaining)}
          </div>
          <div className="w-1/3 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-400 h-2 rounded-full" 
              style={{ 
                width: `${Math.max(0, (timeRemaining / testData.timeLimit) * 100)}%` 
              }}
            ></div>
          </div>
          <div className="flex space-x-3">
            <button className="text-gray-700" title="Change theme">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button className="text-gray-700" title="Help">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-grow py-4 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
            {/* Exam name and code */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-gray-800">{testData.title}</h1>
              <div className="mt-1 flex">
                <div className="font-bold mr-2">C</div>
                <div className="font-bold">{testData.category?.name || 'Uncategorized'}</div>
              </div>
              <div className="mt-2">
                <span className="font-bold">{questionIndex + 1}</span> of <span>{testData.questions.length}</span>
              </div>
              <div className="mt-1 mb-4">
                <p>{currentQuestion.text}</p>
                {currentQuestion.mediaUrl && (
                  <div className="mt-4">
                    <img 
                      src={currentQuestion.mediaUrl} 
                      alt="Question illustration" 
                      className="max-w-full h-auto rounded-md shadow-sm"
                    />
                  </div>
                )}
                {currentQuestion.type === 'multiple-choice' && (
                  <p className="text-sm mt-1">Note: There are {currentQuestion.answers?.filter((a: any) => a.is_correct).length || 0} correct answers to this question.</p>
                )}
              </div>
            </div>
            
            {/* Answer options for choice questions */}
            {(currentQuestion.type === 'single-choice' || 
              currentQuestion.type === 'multiple-choice' || 
              currentQuestion.type === 'true-false') && (
              <div className="space-y-2">
                {currentQuestion.answers?.map((answer: any) => (
                  <div key={answer.id} className="flex items-start space-x-2">
                    <div 
                      className={`flex-shrink-0 w-5 h-5 mt-0.5 border ${
                        isAnswerSelected(answer.id) 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'bg-white border-gray-300'
                      } ${currentQuestion.type === 'multiple-choice' ? 'rounded' : 'rounded-full'}`}
                      onClick={() => handleAnswerSelect(answer.id)}
                    >
                      {isAnswerSelected(answer.id) && (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <label 
                      className="cursor-pointer" 
                      onClick={() => handleAnswerSelect(answer.id)}
                    >
                      {answer.text}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {/* Drag and drop interface */}
            {currentQuestion.type === 'drag-drop' && (
              <div className="mt-4">
                {/* Drop Zones */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {dropZones.map(zone => (
                    <div key={zone} className="border border-gray-300 rounded p-3">
                      <div className="font-medium text-gray-700 mb-2 pb-2 border-b">
                        {zone.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div 
                        className="min-h-[100px] rounded p-2 transition-colors"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, zone)}
                      >
                        {getItemsInZone(zone).map(item => (
                          <div
                            key={item.id}
                            className="bg-blue-100 text-blue-800 px-3 py-2 rounded mb-2 cursor-move"
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragEnd={handleDragEnd}
                          >
                            {item.content}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Unplaced Items */}
                <div className="border-t pt-4">
                  <div className="font-medium text-gray-700 mb-2">Available Items</div>
                  <div className="flex flex-wrap gap-2">
                    {getUnplacedItems().map(item => (
                      <div
                        key={item.id}
                        className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {item.content}
                      </div>
                    ))}
                    {getUnplacedItems().length === 0 && (
                      <div className="text-gray-500 italic">All items have been placed</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Matching question interface */}
            {currentQuestion.type === 'matching' && (
              <div className="mt-4">
                <div className="space-y-3">
                  {currentQuestion.answers?.map((answer: any) => (
                    <div key={answer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-800 mr-3">{answer.left_text} →</span>
                        <select 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={matchingAnswers[currentQuestion.id]?.[answer.id] || ''}
                          onChange={(e) => handleMatchingSelect(answer.id, e.target.value)}
                        >
                          <option value="">Select description...</option>
                          {currentQuestion.answers?.map((option: any) => (
                            <option key={option.id} value={option.right_text}>
                              {option.right_text}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sequence question interface */}
            {currentQuestion.type === 'sequence' && (
              <div className="mt-4">
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Instructions:</strong> Select the correct position (1-4) for each step to arrange them in the proper sequence.
                  </p>
                </div>
                <div className="space-y-3">
                  {currentQuestion.answers?.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <span className="font-medium text-gray-800">{item.text}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Position:</span>
                          <select 
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={sequenceAnswers[currentQuestion.id]?.[item.id] || ''}
                            onChange={(e) => handleSequenceSelect(item.id, parseInt(e.target.value))}
                          >
                            <option value="">Select...</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Progress indicator */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      Progress: {Object.keys(sequenceAnswers[currentQuestion.id] || {}).length} of {currentQuestion.answers?.length || 0} positioned
                    </span>
                    {Object.keys(sequenceAnswers[currentQuestion.id] || {}).length === currentQuestion.answers?.length && (
                      <span className="text-green-600 font-medium">All items positioned!</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button 
                onClick={goToPreviousQuestion}
                disabled={questionIndex === 0}
                className={`px-4 py-2 rounded flex items-center ${
                  questionIndex === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <button 
                onClick={goToNextQuestion}
                disabled={questionIndex >= (testData?.questions.length || 0) - 1}
                className={`px-4 py-2 rounded flex items-center ${
                  questionIndex >= (testData?.questions.length || 0) - 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
            </div>
            
            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50">
                Flag Question
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>
              
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center">
                Submit
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}