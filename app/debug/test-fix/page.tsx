"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// import { createDirectSupabase } from "@/app/lib/direct-supabase";
// import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/app/lib/supabaseClient";

// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!, 
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// console.log("Supabase client created:", supabase);


// Interface definitions
interface DebugLog {
  timestamp: Date;
  level: "info" | "error" | "warn" | "success";
  message: string;
  details?: any;
}

interface Question {
  id: string;
  text: string;
  type: string;
  position: number;
  answers: any[];
}

interface Test {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  categoryId: string;
  category?: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function TestFixPage() {
  const [selectedTest, setSelectedTest] = useState("");
  const [testData, setTestData] = useState<Test | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [testsList, setTestsList] = useState<{id: string, title: string}[]>([]);
  const [questionCache, setQuestionCache] = useState<{[key: string]: Question}>({});
  
  // Convenience getter for current question
  const currentQuestion = allQuestions.length > 0 ? allQuestions[currentQuestionIndex] : null;
  
  // Determine if we can navigate
  const hasNextQuestion = currentQuestionIndex < allQuestions.length - 1;
  const hasPrevQuestion = currentQuestionIndex > 0;
  
  // Add a log entry
  const addLog = (level: DebugLog["level"], message: string, details?: any) => {
    setLogs(prev => [
      {
        timestamp: new Date(),
        level,
        message,
        details
      },
      ...prev
    ]);
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Fetch all questions for a test with batch loading
  const fetchAllQuestions = async () => {
    if (!selectedTest) {
      addLog("error", "No test selected");
      return;
    }
    
    setLoading(true);
    setAllQuestions([]);
    setCurrentQuestionIndex(0);
    setQuestionCache({});
    addLog("info", `Fetching questions for test ID: ${selectedTest}`);
    
    try {
      // Use the test-debug API without limit to get all questions (but not all answers yet)
      const apiUrl = `/api/diagnose/test-debug?testId=${selectedTest}&includeQuestions=true&includeAnswers=false`;
      
      addLog("info", `Calling API to get all questions: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog("error", `API call failed with status ${response.status}`, errorText);
        setLoading(false);
        return;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        addLog("error", "API returned an error", result);
        setLoading(false);
        return;
      }
      
      // Set the test data
      if (result.test) {
        setTestData({
          id: result.test.id,
          title: result.test.title,
          description: result.test.description || "",
          timeLimit: result.test.time_limit,
          categoryId: result.test.category_id,
          category: result.test.categories,
          isActive: result.test.is_active,
          createdAt: new Date(result.test.created_at),
          updatedAt: new Date(result.test.updated_at)
        });
      }
      
      // Store all questions (without all answers loaded yet)
      if (result.questions && result.questions.length > 0) {
        setAllQuestions(result.questions);
        addLog("success", `Successfully retrieved ${result.questions.length} questions`, { 
          questionCount: result.questions.length 
        });
        
        // Begin loading answers for the first few questions
        await prefetchQuestionsAnswers(result.questions, 0);
      } else {
        addLog("warn", "No questions returned from the API");
      }
      
      setLoading(false);
    } catch (error) {
      addLog("error", "Error fetching questions", error);
      setLoading(false);
    }
  };
  
  // Fetch answers for a specific question by index and prefetch adjacent questions
  const prefetchQuestionsAnswers = async (questions: Question[], startIndex: number, prefetchCount = 3) => {
    if (!questions.length || startIndex < 0 || startIndex >= questions.length) {
      return;
    }
    
    setFetchingMore(true);
    
    try {
      // Determine which questions to prefetch
      const endIndex = Math.min(startIndex + prefetchCount, questions.length);
      const questionsToPrefetch = [];
      
      for (let i = startIndex; i < endIndex; i++) {
        const question = questions[i];
        
        // Skip if we already have this question with answers in the cache
        if (questionCache[question.id] && questionCache[question.id].answers && questionCache[question.id].answers.length > 0) {
          continue;
        }
        
        questionsToPrefetch.push(question);
      }
      
      if (questionsToPrefetch.length === 0) {
        setFetchingMore(false);
        return;
      }
      
      // Get all the question IDs we need to fetch
      const questionIds = questionsToPrefetch.map(q => q.id);
      
      addLog("info", `Prefetching answers for ${questionIds.length} questions: [${questionIds.join(', ')}]`);
      
      // Create URLs for each question's answers
      const fetchPromises = questionIds.map(questionId => {
        return fetch(`/api/diagnose/test-debug?testId=${selectedTest}&includeQuestions=true&includeAnswers=true&questionId=${questionId}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch answers for question ${questionId}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.success && data.questions && data.questions.length > 0) {
              // Update the question cache with this question and its answers
              const questionWithAnswers = data.questions[0];
              
              setQuestionCache(prev => ({
                ...prev,
                [questionId]: questionWithAnswers
              }));
              
              // Update the question in the allQuestions array
              setAllQuestions(current => {
                return current.map(q => {
                  if (q.id === questionId) {
                    return questionWithAnswers;
                  }
                  return q;
                });
              });
              
              addLog("success", `Fetched answers for question ${questionId}`, { 
                answerCount: questionWithAnswers.answers?.length || 0 
              });
            }
          })
          .catch(error => {
            addLog("error", `Failed to fetch answers for question ${questionId}`, error);
          });
      });
      
      // Wait for all prefetch requests to complete
      await Promise.all(fetchPromises);
      
    } catch (error) {
      addLog("error", "Error during prefetch", error);
    } finally {
      setFetchingMore(false);
    }
  };
  
  // Navigate to the next question
  const goToNextQuestion = async () => {
    if (hasNextQuestion) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Prefetch more questions if needed
      await prefetchQuestionsAnswers(allQuestions, nextIndex);
    }
  };
  
  // Navigate to the previous question
  const goToPrevQuestion = () => {
    if (hasPrevQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Load available tests from API
  const loadAvailableTests = async () => {
    try {
      addLog("info", "Fetching available tests from API");
      
      const response = await fetch('/api/diagnose/test-debug?testId=list');
      
      if (!response.ok) {
        addLog("error", `Failed to fetch tests, status: ${response.status}`);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.tests && result.tests.length > 0) {
        setTestsList(result.tests);
        addLog("success", `Loaded ${result.tests.length} tests from API`, result.tests);
      } else {
        addLog("warn", "No tests found or API call unsuccessful", result);
      }
    } catch (error) {
      addLog("error", "Error loading tests", error);
    }
  };

  // Handle test selection change
  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTest(e.target.value);
    setTestData(null);
    setAllQuestions([]);
    setCurrentQuestionIndex(0);
    setQuestionCache({});
  };

  // Load available tests on initial render
  useEffect(() => {
    const fetchTests = async () => {
      console.log('erogeor')
      await loadAvailableTests();
      // Set selected test to the first test in the list if tests are loaded and no test is currently selected
      if (testsList.length > 0 && !selectedTest) {
        setSelectedTest(testsList[0].id);
      }
      console.log('jnkn')
      // ✅ Supabase test - fetch 1 row from 'your_table' (change table name)
      console.log(supabase)
      const { data, error } = await supabase.from('tests').select('*').limit(1);
      console.log('supabase', data, error)
      if (error) {
        console.error("❌ Supabase fetch error:", error);
      } else {
        console.log("✅ Supabase connected, data:", data);
      }
    };
    
    fetchTests();
  }, [testsList.length, selectedTest]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Test Fix Page</h1>
          <p className="text-gray-600 mt-2">
            Test questions navigator with prefetching
          </p>
        </div>
        <div className="flex space-x-4">
          <Link href="/debug" className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
            Back to Main Debug
          </Link>
          <Link href="/debug/test-debugger" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Full Test Debugger
          </Link>
        </div>
      </div>

      {/* Test Selection & Controls */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Test</label>
            <select 
              value={selectedTest}
              onChange={handleTestChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {testsList.length > 0 ? (
                testsList.map(test => (
                  <option key={test.id} value={test.id}>
                    {test.title} ({test.id})
                  </option>
                ))
              ) : (
                <option value="">Loading tests...</option>
              )}
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={fetchAllQuestions}
              disabled={loading || !selectedTest}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load Questions"}
            </button>
            
            <button 
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      {allQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <span className="text-sm text-gray-600">
                Viewing Question {currentQuestionIndex + 1} of {allQuestions.length}
              </span>
              <div className="mt-2 bg-gray-200 h-2 rounded-full w-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${(currentQuestionIndex + 1) / allQuestions.length * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex space-x-3 ml-4">
              <button
                onClick={goToPrevQuestion}
                disabled={!hasPrevQuestion || loading || fetchingMore}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={goToNextQuestion}
                disabled={!hasNextQuestion || loading || fetchingMore}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Data and Question */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Test Information */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b">
            <h2 className="font-semibold">Test Information</h2>
          </div>
          <div className="p-4">
            {testData ? (
              <div className="space-y-2">
                <p><span className="font-medium">ID:</span> {testData.id}</p>
                <p><span className="font-medium">Title:</span> {testData.title}</p>
                <p><span className="font-medium">Description:</span> {testData.description}</p>
                <p><span className="font-medium">Time Limit:</span> {testData.timeLimit} seconds</p>
                <p><span className="font-medium">Category:</span> {testData.category?.name || 'N/A'}</p>
                <p><span className="font-medium">Status:</span> {testData.isActive ? 'Active' : 'Inactive'}</p>
                <p><span className="font-medium">Questions:</span> {allQuestions.length}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading test data...' : 'Select a test and click "Load Questions"'}
              </div>
            )}
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b">
            <h2 className="font-semibold">Question {currentQuestionIndex + 1}</h2>
          </div>
          <div className="p-4">
            {currentQuestion ? (
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">{currentQuestion.type}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                    ID: {currentQuestion.id}
                  </span>
                </div>
                <p className="mb-4 text-gray-800">{currentQuestion.text}</p>
                
                <h4 className="font-medium mt-4 mb-2">Answers</h4>
                {fetchingMore && (
                  <div className="mb-3">
                    <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading answers...
                    </div>
                  </div>
                )}
                
                {currentQuestion.answers && currentQuestion.answers.length > 0 ? (
                  <div>
                    {/* Render answers based on question type */}
                    {['single-choice', 'multiple-choice', 'true-false'].includes(currentQuestion.type) && (
                      <div className="space-y-2">
                        {currentQuestion.answers.map((answer: any) => (
                          <div key={answer.id} className="flex items-center p-2 border rounded">
                            <div className={`w-4 h-4 rounded-full mr-2 ${answer.is_correct ? 'bg-green-500' : 'bg-red-100'}`}></div>
                            <span>{answer.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* For matching questions */}
                    {currentQuestion.type === 'matching' && (
                      <div className="grid grid-cols-2 gap-2">
                        {currentQuestion.answers.map((item: any) => (
                          <div key={item.id} className="p-2 border rounded">
                            <div><span className="font-medium">Left:</span> {item.left_text}</div>
                            <div><span className="font-medium">Right:</span> {item.right_text}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* For sequence questions */}
                    {currentQuestion.type === 'sequence' && (
                      <div className="space-y-2">
                        {currentQuestion.answers
                          .sort((a: any, b: any) => a.correct_position - b.correct_position)
                          .map((item: any) => (
                            <div key={item.id} className="p-2 border rounded flex">
                              <span className="bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded mr-2">
                                {item.correct_position}
                              </span>
                              <span>{item.text}</span>
                            </div>
                          ))}
                      </div>
                    )}
                    
                    {/* For drag-drop questions */}
                    {currentQuestion.type === 'drag-drop' && (
                      <div className="space-y-2">
                        {currentQuestion.answers.map((item: any) => (
                          <div key={item.id} className="p-2 border rounded">
                            <div><span className="font-medium">Text:</span> {item.text}</div>
                            <div><span className="font-medium">Category:</span> {item.category}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {fetchingMore ? 'Loading answers...' : 'No answers found for this question'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading question data...' : 'No question data available'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="font-semibold">Debug Logs ({logs.length})</h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
        <div className="overflow-auto max-h-96">
          {logs.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {logs.map((log, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-2 ${
                        log.level === 'error' ? 'bg-red-500' :
                        log.level === 'warn' ? 'bg-yellow-500' :
                        log.level === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}></span>
                      <span className={`font-medium ${
                        log.level === 'error' ? 'text-red-600' :
                        log.level === 'warn' ? 'text-yellow-600' :
                        log.level === 'success' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{log.message}</p>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto max-h-64">
                        {typeof log.details === 'string' 
                          ? log.details 
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No logs available. Fetch questions to generate logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}