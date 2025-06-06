"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientSupabase } from "@/app/supabase";
import { createDirectSupabase } from "@/app/lib/direct-supabase";
import { fetchTestWithQuestions } from "@/app/lib/test-utils";
import { fetchWithRetry, withTimeout } from "@/app/lib/fetch-utils";
import { TestData, Question, QuestionType } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

// No longer using hardcoded test IDs - we'll load all tests from the database

interface DebugLog {
  timestamp: Date;
  level: "info" | "error" | "warn" | "success";
  message: string;
  details?: any;
}

interface TestResult {
  success: boolean;
  data?: any;
  error?: any;
  duration: number;
}

export default function TestDebuggerPage() {
  const [selectedTest, setSelectedTest] = useState("");
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [activeTab, setActiveTab] = useState<'test' | 'questions' | 'answers' | 'logs'>('test');
  const [testsList, setTestsList] = useState<{id: string, title: string}[]>([]);
  
  // Override console.log/error/warn to also add to our debug logs
  useEffect(() => {
    // Store the original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Override console.log
    console.log = (...args) => {
      // Call the original method
      originalLog(...args);
      
      // Add to our logs if it's related to our test fetching
      const message = args.join(' ');
      if (message.includes('fetchTestWithQuestions') || 
          message.includes('test-fetch') || 
          message.includes('question') || 
          message.includes('answer')) {
        addLog("info", message);
      }
    };
    
    // Override console.error
    console.error = (...args) => {
      // Call the original method
      originalError(...args);
      
      // Add to our logs if it's related to our test fetching
      const message = args.join(' ');
      if (message.includes('fetchTestWithQuestions') || 
          message.includes('test-fetch') || 
          message.includes('question') || 
          message.includes('answer')) {
        addLog("error", message);
      }
    };
    
    // Override console.warn
    console.warn = (...args) => {
      // Call the original method
      originalWarn(...args);
      
      // Add to our logs if it's related to our test fetching
      const message = args.join(' ');
      if (message.includes('fetchTestWithQuestions') || 
          message.includes('test-fetch') || 
          message.includes('question') || 
          message.includes('answer')) {
        addLog("warn", message);
      }
    };
    
    // Restore original methods when the component unmounts
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

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
    
    // Automatically switch to logs tab on errors
    if (level === "error") {
      setActiveTab("logs");
    }
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Function to fetch answers for question types stored in answers table
  const fetchStandardAnswers = async (supabase: any, questionId: string, questionType: string) => {
    // Only fetch answers for question types stored in answers table
    const supportedTypes = ['single-choice', 'multiple-choice', 'true-false'];
    if (!supportedTypes.includes(questionType)) {
      return [];
    }
    
    addLog("info", `Fetching answers for ${questionType} question ${questionId}`);
    
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', questionId);
        
      if (error) {
        addLog("error", `Error fetching answers for ${questionType} question ${questionId}`, error);
        return [];
      }
      
      if (data && data.length > 0) {
        addLog("success", `Found ${data.length} answers for ${questionType} question ${questionId}`);
        return data;
      } else {
        addLog("warn", `No answers found for ${questionType} question ${questionId}`);
        return [];
      }
    } catch (error) {
      addLog("error", `Exception fetching answers for ${questionType} question ${questionId}`, error);
      return [];
    }
  };
  
  const simpleFetchTest = async () => {
    if (!selectedTest) {
      addLog("error", "No test selected");
      return;
    }
    
    setLoading(true);
    addLog("info", `Simple fetch for test ID: ${selectedTest}`);
    
    try {
      const supabase = createDirectSupabase();
      
      // Basic test data
      const { data: test, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', selectedTest)
        .single();
        
      if (testError) {
        addLog("error", "Error fetching test data", testError);
        setLoading(false);
        return;
      }
      
      addLog("success", "Test data:", test);
      
      // Get questions - try test_questions with questions join first
      try {
        addLog("info", "Trying to fetch questions using test_questions table");
          
        const { data, error } = await supabase
          .from('test_questions')
          .select('*, questions(*)')
          .eq('test_id', selectedTest)
          .limit(20); // Limit to 20 questions to avoid long loading times
          
        if (!error && data && data.length > 0) {
          addLog("success", `Successfully fetched ${data.length} questions from test_questions table`);
          
          // Process questions with answers for supported types
          const processedQuestions = [];
          const supportedTypes = ['single-choice', 'multiple-choice', 'true-false'];
          
          // Set a maximum time for fetching answers
          const startTime = Date.now();
          const maxProcessingTime = 10000; // 10 seconds max
          
          for (const q of data) {
            // Check if we've been processing too long
            if (Date.now() - startTime > maxProcessingTime) {
              addLog("warn", "Processing time limit reached, some answers may be incomplete");
              break;
            }
            
            const questionId = q.question_id;
            const questionType = q.questions?.type || "unknown";
            const questionText = q.questions?.text || "Question text unavailable";
            
            // Fetch answers for supported question types
            let answers = [];
            if (supportedTypes.includes(questionType)) {
              answers = await fetchStandardAnswers(supabase, questionId, questionType);
            }
            
            processedQuestions.push({
              id: questionId,
              text: questionText,
              type: questionType,
              position: q.position,
              answers: answers
            });
          }
          
          // Create a simplified test data object
          const simpleTestData: TestData = {
            id: test.id,
            title: test.title,
            description: test.description || "",
            timeLimit: test.time_limit,
            categoryIds: test.category_id ? [test.category_id] : [],
            categories: [], // We don't need this for basic display
            isActive: test.is_active,
            createdAt: new Date(test.created_at),
            updatedAt: new Date(test.updated_at),
            questions: processedQuestions,
            sessionId: `session-${Date.now()}`,
            startTime: new Date(),
            timeRemaining: test.time_limit
          };
          
          setTestData(simpleTestData);
          addLog("success", "Created simplified test data object with questions and answers", { 
            testTitle: simpleTestData.title,
            questionCount: simpleTestData.questions.length
          });
          setLoading(false);
          return;
        } else if (error) {
          addLog("warn", "Error fetching questions from test_questions table:", error);
        } else {
          addLog("warn", "No questions found in test_questions table");
        }
      } catch (e) {
        addLog("error", "Exception trying to query test_questions table:", e);
      }
      
      // If that fails, try direct access to the questions table
      try {
        addLog("info", "Trying to fetch questions directly from questions table");
          
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', selectedTest)
          .limit(20); // Limit to 20 questions to avoid long loading times
          
        if (!error && data && data.length > 0) {
          addLog("success", `Successfully fetched ${data.length} questions directly from questions table`);
          
          // Process questions with answers for supported types
          const processedQuestions = [];
          const supportedTypes = ['single-choice', 'multiple-choice', 'true-false'];
          
          // Set a maximum time for fetching answers
          const startTime = Date.now();
          const maxProcessingTime = 10000; // 10 seconds max
          
          for (const q of data) {
            // Check if we've been processing too long
            if (Date.now() - startTime > maxProcessingTime) {
              addLog("warn", "Processing time limit reached, some answers may be incomplete");
              break;
            }
            
            const questionId = q.id;
            const questionType = q.type || "unknown";
            const questionText = q.text || "Question text unavailable";
            
            // Fetch answers for supported question types
            let answers = [];
            if (supportedTypes.includes(questionType)) {
              answers = await fetchStandardAnswers(supabase, questionId, questionType);
            }
            
            processedQuestions.push({
              id: questionId,
              text: questionText,
              type: questionType,
              position: q.position || 0,
              answers: answers
            });
          }
          
          // Create a simplified test data object
          const simpleTestData: TestData = {
            id: test.id,
            title: test.title,
            description: test.description || "",
            timeLimit: test.time_limit,
            categoryIds: test.category_id ? [test.category_id] : [],
            categories: [], // We don't need this for basic display
            isActive: test.is_active,
            createdAt: new Date(test.created_at),
            updatedAt: new Date(test.updated_at),
            questions: processedQuestions,
            sessionId: `session-${Date.now()}`,
            startTime: new Date(),
            timeRemaining: test.time_limit
          };
          
          setTestData(simpleTestData);
          addLog("success", "Created simplified test data object with questions (no answers)", { 
            testTitle: simpleTestData.title,
            questionCount: simpleTestData.questions.length
          });
          setLoading(false);
          return;
        } else if (error) {
          addLog("warn", "Error fetching questions directly from questions table:", error);
        } else {
          addLog("warn", "No questions found directly in questions table");
        }
      } catch (e) {
        addLog("error", "Exception trying to query questions table:", e);
      }
      
      // If all methods fail, create an empty test data object
      const emptyTestData: TestData = {
        id: test.id,
        title: test.title,
        description: test.description || "",
        timeLimit: test.time_limit,
        categoryIds: test.category_id ? [test.category_id] : [],
        categories: [],
        isActive: test.is_active,
        createdAt: new Date(test.created_at),
        updatedAt: new Date(test.updated_at),
        questions: [],
        sessionId: `session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: test.time_limit
      };
      
      setTestData(emptyTestData);
      addLog("warn", "Created test data object with no questions - all fetching methods failed");
      setLoading(false);
    } catch (error) {
      addLog("error", "Simple fetch failed", error);
      setLoading(false);
    }
  };
  
  // Load available tests from Supabase
  const loadAvailableTests = async () => {
    try {
      addLog("info", "Fetching available tests from database");
      // Use direct Supabase client to avoid auth issues
      const supabase = createDirectSupabase();
      
      // Try direct API first (more reliable)
      try {
        const response = await fetch('/api/debug-prep/test-fetch?testId=list');
        if (response.ok) {
          const result = await response.json();
          if (result.tests && result.tests.length > 0) {
            setTestsList(result.tests);
            addLog("success", `Loaded ${result.tests.length} tests from API`, result.tests);
            return;
          }
        }
      } catch (apiError) {
        addLog("warn", "Failed to fetch tests from API, falling back to direct database query", apiError);
      }
      
      // Fallback to direct Supabase query
      const { data, error } = await supabase
        .from('tests')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) {
        addLog("error", "Failed to fetch tests", error);
        return;
      }
      
      if (data && data.length > 0) {
        setTestsList(data);
        addLog("success", `Loaded ${data.length} tests from database`, data);
      } else {
        addLog("warn", "No tests found in database");
      }
    } catch (error) {
      addLog("error", "Error loading tests", error);
    }
  };

  // Handle test selection change
  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTest(e.target.value);
    setTestData(null);
    setTestResults({});
  };

  // Load available tests on initial render and set selected test
  useEffect(() => {
    const fetchTests = async () => {
      await loadAvailableTests();
      // Set selected test to the first test in the list if tests are loaded and no test is currently selected
      if (testsList.length > 0 && !selectedTest) {
        setSelectedTest(testsList[0].id);
      }
    };
    
    fetchTests();
  }, [testsList.length, selectedTest]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Test Page Debugger</h1>
          <p className="text-gray-600 mt-2">
            Diagnose and troubleshoot functions used in the test page
          </p>
        </div>
        <div className="flex space-x-4">
          <Link href="/debug" className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
            Back to Main Debug
          </Link>
          <Link href="/test" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Go to Test Page
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
              {/* Tests from database */}
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
              onClick={simpleFetchTest}
              disabled={loading || !selectedTest}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Running..." : "Quick Test View"}
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

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('test')}
            className={cn(
                "py-2 px-4 text-center border-b-2 font-medium text-sm",
                activeTab === 'test'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
          >
            Test Data
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={cn(
                "py-2 px-4 text-center border-b-2 font-medium text-sm",
                activeTab === 'questions'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={cn(
                "py-2 px-4 text-center border-b-2 font-medium text-sm",
                activeTab === 'answers'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
          >
            Answers
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={cn(
                "py-2 px-4 text-center border-b-2 font-medium text-sm",
                activeTab === 'logs'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
          >
            Debug Logs ({logs.length})
          </button>
        </nav>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {activeTab === 'test' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h2 className="font-semibold">Test Data</h2>
            </div>
            <div className="p-4">
              {testData ? (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-medium">Test Details</h3>
                      <div className="mt-2 space-y-2">
                        <p><span className="font-medium">ID:</span> {testData.id}</p>
                        <p><span className="font-medium">Title:</span> {testData.title}</p>
                        <p><span className="font-medium">Description:</span> {testData.description}</p>
                        <p><span className="font-medium">Time Limit:</span> {testData.timeLimit} seconds</p>
                        <p><span className="font-medium">Category:</span> {testData.categories?.[0]?.name || 'N/A'}</p>
                        <p><span className="font-medium">Questions:</span> {testData.questions.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading test data...' : 'Run a test to see results'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h2 className="font-semibold">Questions</h2>
            </div>
            <div className="p-4">
              {testData && testData.questions && testData.questions.length > 0 ? (
                <div className="space-y-6">
                  {testData.questions.map((question, index) => (
                    <div key={question.id} className="border rounded p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">Question {index + 1}: {question.type}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                          ID: {question.id}
                        </span>
                      </div>
                      <p className="mt-2">{question.text}</p>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Question Type Debug</h4>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Type:</span> {question.type}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Answer Count:</span> {question.answers?.length || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading questions...' : 'No questions available'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'answers' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h2 className="font-semibold">Answers by Question Type</h2>
            </div>
            <div className="p-4">
              {testData && testData.questions && testData.questions.length > 0 ? (
                <div className="space-y-8">
                  {testData.questions.map((question, index) => (
                    <div key={question.id} className="border rounded p-4">
                      <h3 className="font-medium">Question {index + 1}: {question.text}</h3>
                      <p className="text-sm text-gray-600 mt-1">Type: {question.type}</p>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700">Answers Data</h4>
                        
                        {/* Show answers for question types stored in answers table */}
                        {['single-choice', 'multiple-choice', 'true-false'].includes(question.type) && 
                         question.answers && question.answers.length > 0 ? (
                          <div className="mt-2">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {question.answers.map((answer: any) => (
                                  <tr key={answer.id}>
                                    <td className="px-3 py-2 text-sm text-gray-500">{answer.id}</td>
                                    <td className="px-3 py-2 text-sm">{answer.text}</td>
                                    <td className="px-3 py-2 text-sm">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {answer.is_correct ? 'Yes' : 'No'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">
                            {['single-choice', 'multiple-choice', 'true-false'].includes(question.type) ? 
                              `No answers data available for this ${question.type} question` : 
                              `Answers for ${question.type} questions are stored in a different table and not loaded in this view`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Loading answers...' : 'No questions/answers available'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-semibold">Debug Logs ({logs.length})</h2>
              <button
                onClick={clearLogs}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="overflow-auto max-h-screen">
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
                  No logs available. Run tests to generate logs.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}