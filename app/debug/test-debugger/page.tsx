"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClientSupabase } from "@/app/supabase";
import { createDirectSupabase } from "@/app/lib/direct-supabase";
import { fetchTestWithQuestions } from "@/app/lib/test-utils";
import { fetchWithRetry, withTimeout } from "@/app/lib/fetch-utils";
import { TestData, Question, QuestionType, Answer } from "@/app/lib/types";
import { getHardcodedQuestions, testQuestionTypeSupport, traceTestDataLoading, loadTestDataOptimized } from "@/app/lib/test-debugger-utils";

// Sample test IDs to test with
const TEST_IDS = [
  { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", name: "JavaScript Basics" },
  { id: "00000000-0000-0000-0000-000000000001", name: "Sample Test 1" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Sample Test 2" },
];

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
  const [selectedTest, setSelectedTest] = useState(TEST_IDS[0].id);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [activeTab, setActiveTab] = useState<'test' | 'questions' | 'answers' | 'logs' | 'diagnostics'>('test');
  const [testsList, setTestsList] = useState<{id: string, title: string}[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<any>({});
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

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

  // Load available tests from Supabase
  const loadAvailableTests = async () => {
    try {
      addLog("info", "Fetching available tests from database");
      const supabase = createClientSupabase();
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

  // Test function: fetchTestWithQuestions
  const testFetchTestWithQuestions = async () => {
    addLog("info", `Testing fetchTestWithQuestions with test ID: ${selectedTest}`);
    const startTime = performance.now();
    try {
      const supabase = createClientSupabase();
      const result = await fetchTestWithQuestions(supabase, selectedTest);
      const duration = performance.now() - startTime;
      
      if (result) {
        addLog("success", `Successfully fetched test with ${result.questions.length} questions`, result);
        setTestData(result);
        setTestResults(prev => ({
          ...prev,
          fetchTestWithQuestions: {
            success: true,
            data: result,
            duration
          }
        }));
      } else {
        addLog("error", "Failed to fetch test with questions");
        setTestResults(prev => ({
          ...prev,
          fetchTestWithQuestions: {
            success: false,
            error: "No result returned",
            duration
          }
        }));
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog("error", "Error in fetchTestWithQuestions", error);
      setTestResults(prev => ({
        ...prev,
        fetchTestWithQuestions: {
          success: false,
          error,
          duration
        }
      }));
    }
  };

  // Test function: Direct database access
  const testDirectDatabaseAccess = async () => {
    addLog("info", `Testing direct database access for test ID: ${selectedTest}`);
    const startTime = performance.now();
    try {
      const supabase = createDirectSupabase();
      
      // Test data
      const testResult = await supabase
        .from('tests')
        .select('*, categories(*)')
        .eq('id', selectedTest)
        .single();
      
      // Test questions
      const questionsResult = await supabase
        .from('test_questions')
        .select('*, questions(*)')
        .eq('test_id', selectedTest)
        .order('position', { ascending: true });
      
      const duration = performance.now() - startTime;
      
      if (testResult.error || questionsResult.error) {
        addLog("error", "Error in direct database access", { 
          testError: testResult.error, 
          questionsError: questionsResult.error 
        });
        setTestResults(prev => ({
          ...prev,
          directDatabaseAccess: {
            success: false,
            error: { testError: testResult.error, questionsError: questionsResult.error },
            duration
          }
        }));
      } else {
        addLog("success", "Direct database access successful", { 
          test: testResult.data, 
          questions: questionsResult.data 
        });
        setTestResults(prev => ({
          ...prev,
          directDatabaseAccess: {
            success: true,
            data: { test: testResult.data, questions: questionsResult.data },
            duration
          }
        }));
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog("error", "Error in direct database access", error);
      setTestResults(prev => ({
        ...prev,
        directDatabaseAccess: {
          success: false,
          error,
          duration
        }
      }));
    }
  };
  
  // Function to fetch answer options for all loaded questions
  const fetchAnswers = async () => {
    if (!testData || !testData.questions || testData.questions.length === 0) {
      addLog("error", "No questions loaded. Please fetch questions first.");
      return;
    }
    
    setAnswersLoading(true);
    addLog("info", `Fetching answers for all ${testData.questions.length} questions...`);
    
    try {
      // Use the API to get answers for all questions
      addLog("info", "Trying special debug API endpoint for answers");
      const apiResponse = await fetch(`/api/diagnose/test-debug?testId=${selectedTest}&includeQuestions=true&includeAnswers=true`);
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data.success && data.answers) {
          // Process answers from the API response
          const totalAnswers = Object.values(data.answers).reduce((sum: number, arr: unknown) => sum + (arr as any[]).length, 0);
          const questionsWithAnswers = Object.keys(data.answers).length;
          
          addLog("success", `Received ${totalAnswers} answers for ${questionsWithAnswers} questions from debug API endpoint`);
          
          // Update question answers
          setQuestionAnswers(data.answers);
          
          // Update all questions with their answers for direct display
          setTestData(prevData => {
            if (!prevData) return null;
            const updatedQuestions = prevData.questions.map(q => 
              data.answers[q.id] ? { ...q, answers: data.answers[q.id] } : q
            );
            return {
              ...prevData,
              questions: updatedQuestions
            };
          });
          
          setAnswersLoading(false);
          setActiveTab('answers');
          return;
        }
      }
      
      addLog("warn", "API endpoint failed for answers, falling back to direct query");
      
      // Get answers for all questions
      const questionIds = testData.questions.map(q => q.id);
      const questionTypes = testData.questions.reduce((acc, q) => {
        acc[q.id] = q.type;
        return acc;
      }, {} as {[id: string]: string});
      const supabase = createDirectSupabase();
      
      // Answer map to store all answers by question ID
      const answersMap: {[questionId: string]: any[]} = {};
      
      // Group question IDs by type for batch querying
      const choiceQuestionIds = questionIds.filter(id => 
        ['multiple-choice', 'single-choice', 'true-false'].includes(questionTypes[id])
      );
      const matchingQuestionIds = questionIds.filter(id => questionTypes[id] === 'matching');
      const sequenceQuestionIds = questionIds.filter(id => questionTypes[id] === 'sequence');
      const dragDropQuestionIds = questionIds.filter(id => questionTypes[id] === 'drag-drop');
      
      // Use promise.all to fetch answers for different question types in parallel
      const fetchPromises = [];
      
      // Fetch multiple choice answers
      if (choiceQuestionIds.length > 0) {
        addLog("info", `Fetching choice answers for ${choiceQuestionIds.length} questions`);
        fetchPromises.push(
          supabase
            .from('answers')
            .select('*')
            .in('question_id', choiceQuestionIds)
            .then(({ data, error }) => {
              if (error) {
                addLog("error", `Error fetching from 'answers' table: ${error.message}`);
                return;
              }
              
              if (data && data.length > 0) {
                // Group answers by question_id
                data.forEach(answer => {
                  if (!answersMap[answer.question_id]) {
                    answersMap[answer.question_id] = [];
                  }
                  answersMap[answer.question_id].push(answer);
                });
                
                addLog("success", `Found ${data.length} choice answers for ${Object.keys(answersMap).length} questions`);
              } else {
                addLog("info", "No choice answers found");
              }
            })
        );
      }
      
      // Fetch matching answers
      if (matchingQuestionIds.length > 0) {
        addLog("info", `Fetching matching items for ${matchingQuestionIds.length} questions`);
        fetchPromises.push(
          supabase
            .from('match_items')
            .select('*')
            .in('question_id', matchingQuestionIds)
            .then(({ data, error }) => {
              if (error) {
                addLog("error", `Error fetching from 'match_items' table: ${error.message}`);
                return;
              }
              
              if (data && data.length > 0) {
                // Group items by question_id
                data.forEach(item => {
                  if (!answersMap[item.question_id]) {
                    answersMap[item.question_id] = [];
                  }
                  answersMap[item.question_id].push(item);
                });
                
                addLog("success", `Found ${data.length} matching pairs`);
              } else {
                addLog("info", "No matching pairs found");
              }
            })
        );
      }
      
      // Fetch sequence answers
      if (sequenceQuestionIds.length > 0) {
        addLog("info", `Fetching sequence items for ${sequenceQuestionIds.length} questions`);
        fetchPromises.push(
          supabase
            .from('sequence_items')
            .select('*')
            .in('question_id', sequenceQuestionIds)
            .order('correct_position', { ascending: true })
            .then(({ data, error }) => {
              if (error) {
                addLog("error", `Error fetching from 'sequence_items' table: ${error.message}`);
                return;
              }
              
              if (data && data.length > 0) {
                // Group items by question_id
                data.forEach(item => {
                  if (!answersMap[item.question_id]) {
                    answersMap[item.question_id] = [];
                  }
                  answersMap[item.question_id].push(item);
                });
                
                addLog("success", `Found ${data.length} sequence items`);
              } else {
                addLog("info", "No sequence items found");
              }
            })
        );
      }
      
      // Fetch drag-drop answers
      if (dragDropQuestionIds.length > 0) {
        addLog("info", `Fetching drag-drop items for ${dragDropQuestionIds.length} questions`);
        fetchPromises.push(
          supabase
            .from('drag_drop_items')
            .select('*')
            .in('question_id', dragDropQuestionIds)
            .then(({ data, error }) => {
              if (error) {
                addLog("error", `Error fetching from 'drag_drop_items' table: ${error.message}`);
                return;
              }
              
              if (data && data.length > 0) {
                // Group items by question_id
                data.forEach(item => {
                  if (!answersMap[item.question_id]) {
                    answersMap[item.question_id] = [];
                  }
                  answersMap[item.question_id].push(item);
                });
                
                addLog("success", `Found ${data.length} drag-drop items`);
              } else {
                addLog("info", "No drag-drop items found");
              }
            })
        );
      }
      
      // Wait for all fetches to complete with timeout protection
      try {
        await Promise.race([
          Promise.all(fetchPromises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Answers fetch timeout')), 15000))
        ]);
      } catch (error) {
        addLog("warn", `Some answer fetching timed out or failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // For demo test, try to use hardcoded data for any questions without answers
      if (selectedTest === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
        const questionsWithoutAnswers = questionIds.filter(id => !answersMap[id]);
        
        if (questionsWithoutAnswers.length > 0) {
          addLog("info", `Trying hardcoded answers for ${questionsWithoutAnswers.length} questions without answers`);
          
          const hardcodedQuestions = getHardcodedQuestions(selectedTest);
          
          questionsWithoutAnswers.forEach(questionId => {
            const matchingQuestion = hardcodedQuestions.find(q => q.id === questionId);
            
            if (matchingQuestion?.answers && matchingQuestion.answers.length > 0) {
              answersMap[questionId] = matchingQuestion.answers;
              addLog("success", `Found ${matchingQuestion.answers.length} hardcoded answers for question ${questionId}`);
            }
          });
        }
      }
      
      // Calculate stats for logging
      const totalAnswers = Object.values(answersMap).reduce((sum, arr) => sum + arr.length, 0);
      const questionsWithAnswers = Object.keys(answersMap).length;
      
      // Update state with all answers
      if (totalAnswers > 0) {
        setQuestionAnswers(answersMap);
        
        // Update all questions with their answers
        setTestData(prevData => {
          if (!prevData) return null;
          const updatedQuestions = prevData.questions.map(q => 
            answersMap[q.id] ? { ...q, answers: answersMap[q.id] } : q
          );
          return {
            ...prevData,
            questions: updatedQuestions
          };
        });
        
        addLog("success", `Loaded ${totalAnswers} answers for ${questionsWithAnswers}/${questionIds.length} questions`);
      } else {
        addLog("info", "No answers found for any questions");
      }
      
      setAnswersLoading(false);
      setActiveTab('answers');
    } catch (error) {
      addLog("error", "Error fetching answers", error);
      setAnswersLoading(false);
    }
  };
  
  // Test API endpoint
  const testAPIEndpoint = async () => {
    addLog("info", `Testing API endpoint for test ID: ${selectedTest}`);
    const startTime = performance.now();
    try {
      const response = await fetch(`/api/test-debug/${selectedTest}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        addLog("success", `API endpoint succeeded in ${duration.toFixed(2)}ms`, data);
        setTestResults(prev => ({
          ...prev,
          apiEndpoint: {
            success: true,
            data,
            duration
          }
        }));
      } else {
        addLog("error", `API endpoint failed with status ${response.status}`);
        setTestResults(prev => ({
          ...prev,
          apiEndpoint: {
            success: false,
            error: `Status ${response.status}`,
            duration
          }
        }));
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog("error", "Error calling API endpoint", error);
      setTestResults(prev => ({
        ...prev,
        apiEndpoint: {
          success: false,
          error,
          duration
        }
      }));
    }
  };

  // Test preparation time
  const testPreparationTime = async () => {
    addLog("info", "Testing test preparation time");
    const startTime = performance.now();
    try {
      // Simulate test preparation steps
      const supabase = createClientSupabase();
      
      // Step 1: Load test
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('*')
        .eq('id', selectedTest)
        .single();
      
      if (testError) throw testError;
      
      // Step 2: Load questions
      const { data: questions, error: questionsError } = await supabase
        .from('test_questions')
        .select('*, questions(*)')
        .eq('test_id', selectedTest);
      
      if (questionsError) throw questionsError;
      
      const duration = performance.now() - startTime;
      addLog("success", `Test preparation completed in ${duration.toFixed(2)}ms`);
      setTestResults(prev => ({
        ...prev,
        preparationTime: {
          success: true,
          data: { testData, questionCount: questions?.length || 0 },
          duration
        }
      }));
    } catch (error) {
      const duration = performance.now() - startTime;
      addLog("error", "Error in test preparation", error);
      setTestResults(prev => ({
        ...prev,
        preparationTime: {
          success: false,
          error,
          duration
        }
      }));
    }
  };

  // Function to fetch a single question and its answers for the selected test
  const fetchQuestions = async () => {
    if (!selectedTest || !testData) {
      addLog("error", "No test selected or test data not loaded");
      return;
    }
    
    setQuestionsLoading(true);
    addLog("info", `Fetching a single question for test ID: ${selectedTest}`);
    
    try {
      // Use the special debug API endpoint
      addLog("info", "Trying special debug API endpoint for questions and answers");
      
      // Call our API to get test, questions, and answers - fetch all questions
      const apiResponse = await fetch(`/api/diagnose/test-debug?testId=${selectedTest}&includeQuestions=true&includeAnswers=true`);
      
      if (!apiResponse.ok) {
        throw new Error(`API request failed with status ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      
      if (!data.success) {
        throw new Error(`API returned error: ${data.message || 'Unknown error'}`);
      }
      
      if (!data.questions || data.questions.length === 0) {
        addLog("error", "No questions returned from API");
        setQuestionsLoading(false);
        return;
      }
      
      // We have questions from the API
      addLog("success", `Loaded ${data.questions.length} question from debug API`, {
        sampleQuestion: data.questions[0] || null
      });
      
      // Process questions and add their answers
      const processedQuestions = data.questions.map((q: any) => {
        // Get any answers for this question from the answers map
        const answers = data.answers && data.answers[q.id] ? data.answers[q.id] : [];
        
        return {
          ...q,
          answers: answers
        };
      });
      
      // Update test data with questions and answers
      setTestData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          questions: processedQuestions
        };
      });
      
      // Also update the answers state
      if (data.answers) {
        setQuestionAnswers(data.answers);
      }
      
      setQuestionsLoading(false);
      setActiveTab('questions');
      
      // If we have answers, log them too
      if (data.answers) {
        const totalAnswers = Object.values(data.answers).reduce((sum: any, arr: any) => sum + arr.length, 0);
        
        addLog("success", `Loaded ${totalAnswers} answer options for ${Object.keys(data.answers).length} question`, {
          stats: data.stats || { 
            totalQuestions: processedQuestions.length,
            questionsWithAnswers: Object.keys(data.answers).length
          }
        });
      }
    } catch (error) {
      addLog("error", "Error fetching question and answers", error);
      
      // Fallback to hardcoded data for demo test
      if (selectedTest === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
        addLog("info", "Using hardcoded question for demo test");
        
        // Get just one hardcoded question with its answers
        const hardcodedQuestions = getHardcodedQuestions(selectedTest);
        
        if (hardcodedQuestions && hardcodedQuestions.length > 0) {
          const singleQuestion = [hardcodedQuestions[0]];
          
          // Update test data with single hardcoded question
          setTestData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              questions: singleQuestion
            };
          });
          
          // Update answers map if the question has answers
          if (singleQuestion[0].answers && singleQuestion[0].answers.length > 0) {
            const answersMap = {
              [singleQuestion[0].id]: singleQuestion[0].answers
            };
            setQuestionAnswers(answersMap);
          }
          
          addLog("success", "Loaded 1 hardcoded question with its answers");
          setQuestionsLoading(false);
          setActiveTab('questions');
          return;
        }
      }
      
      setQuestionsLoading(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    clearLogs();
    addLog("info", "Running all tests...");
    
    try {
      // Run each test in sequence
      await testFetchTestWithQuestions();
      await testDirectDatabaseAccess();
      await testAPIEndpoint();
      await testPreparationTime();
      await fetchAnswers();
      
      addLog("success", "All tests completed!");
    } catch (error) {
      addLog("error", "Error running all tests", error);
    } finally {
      setLoading(false);
    }
  };

  // Run diagnostic tests on the selected test
  const runDiagnostics = async () => {
    if (!selectedTest) {
      addLog("error", "No test selected for diagnostics");
      return;
    }

    setDiagnosticsLoading(true);
    addLog("info", `Running diagnostics for test ID: ${selectedTest}`);
    
    try {
      const diagnosticsResults: any = {
        questionTypeSupport: null,
        traceTestLoading: null,
        optimizedLoading: null,
        performanceComparison: null
      };

      // Test 1: Check question type support
      addLog("info", "Testing question type support");
      const questionTypeResult = await testQuestionTypeSupport();
      diagnosticsResults.questionTypeSupport = questionTypeResult;
      addLog("success", "Question type support test completed", questionTypeResult);

      // Test 2: Trace the test loading process
      addLog("info", `Tracing test loading process for ID: ${selectedTest}`);
      const startTime = performance.now();
      const traceResult = await traceTestDataLoading(selectedTest);
      const traceEndTime = performance.now();
      diagnosticsResults.traceTestLoading = {
        ...traceResult,
        totalDuration: traceEndTime - startTime
      };
      addLog("success", "Test loading trace completed", {
        success: traceResult.success,
        steps: traceResult.trace?.length,
        totalDuration: `${Math.round(traceEndTime - startTime)}ms`
      });

      // Test 3: Test optimized loading
      addLog("info", `Testing optimized loading for ID: ${selectedTest}`);
      const optimizedStart = performance.now();
      const optimizedResult = await loadTestDataOptimized(selectedTest);
      const optimizedEnd = performance.now();
      diagnosticsResults.optimizedLoading = {
        ...optimizedResult,
        totalDuration: optimizedEnd - optimizedStart
      };
      addLog("success", "Optimized loading test completed", {
        success: optimizedResult.success,
        questionCount: optimizedResult.questionCount,
        answerCount: optimizedResult.answerCount,
        duration: `${Math.round(optimizedEnd - optimizedStart)}ms`
      });

      // Performance comparison
      if (traceResult.success && optimizedResult.success) {
        const standardDuration = traceEndTime - startTime;
        const optimizedDuration = optimizedEnd - optimizedStart;
        const improvement = Math.round((1 - (optimizedDuration / standardDuration)) * 100);
        
        diagnosticsResults.performanceComparison = {
          standardDuration,
          optimizedDuration,
          improvement,
          fasterMethod: optimizedDuration < standardDuration ? 'optimized' : 'standard'
        };
        
        addLog("info", `Performance comparison: ${improvement}% ${improvement > 0 ? 'improvement' : 'slower'} with optimized loading`);
      }

      // Set the results and switch to the diagnostics tab
      setDiagnosticResults(diagnosticsResults);
      setDiagnosticsLoading(false);
      setActiveTab('diagnostics');
      
      addLog("success", "Selected tests completed");
    } catch (error) {
      addLog("error", "Error running selected tests", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle test selection change
  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTest(e.target.value);
    setTestData(null);
    setTestResults({});
  };

  // Load available tests on initial render
  useEffect(() => {
    loadAvailableTests();
  }, []);

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
              {/* Include predefined test IDs */}
              {TEST_IDS.map(test => (
                <option key={test.id} value={test.id}>
                  {test.name} ({test.id})
                </option>
              ))}
              
              {/* Include tests from database */}
              {testsList.map(test => (
                <option key={test.id} value={test.id}>
                  {test.title} ({test.id})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={testFetchTestWithQuestions}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Running..." : "Test Selected Test"}
            </button>
            
            <button 
              onClick={runAllTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Running..." : "Run All Tests"}
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
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'test'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Test Data
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'answers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Answers
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
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
                    <div>
                      <h3 className="font-medium">Test Performance</h3>
                      {Object.entries(testResults).map(([name, result]) => (
                        <div key={name} className="mt-2">
                          <p>
                            <span className="font-medium">{name}:</span>{' '}
                            <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                              {result.success ? 'Success' : 'Failed'}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">Duration: {result.duration.toFixed(2)} ms</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="font-medium mt-4">Raw Test Data</h3>
                  <pre className="mt-2 bg-gray-50 p-3 rounded overflow-auto max-h-96 text-sm">
                    {JSON.stringify(testData, null, 2)}
                  </pre>
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
            <div className="overflow-auto max-h-[calc(100vh-300px)]">
              {answersLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading answer options...
                </div>
              ) : Object.keys(questionAnswers).length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {testData?.questions.map((question, qIndex) => {
                    const answers = questionAnswers[question.id] || [];
                    
                    // Find the question text by ID
                    const questionText = question.text || 'Unknown Question';
                    const questionType = question.type || 'unknown';
                    
                    return (
                      <div key={question.id} className="p-4 hover:bg-gray-50">
                        <div className="mb-2">
                          <h3 className="font-medium flex justify-between">
                            <span>
                              <span className="inline-block w-8 h-8 mr-2 rounded-full bg-gray-200 text-center leading-8">
                                {qIndex + 1}
                              </span>
                              {questionText}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                              {questionType}
                            </span>
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Question ID: {question.id}
                          </p>
                        </div>
                        
                        {answers.length > 0 ? (
                          <div className="ml-10 mt-3">
                            <h4 className="text-sm font-medium mb-2">Answer Options ({answers.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Different display based on question type */}
                              {['multiple-choice', 'single-choice', 'true-false'].includes(questionType) && (
                                <div className="space-y-2 col-span-2">
                                  {answers.map((answer: any, i: number) => (
                                    <div key={answer.id} className="flex items-start space-x-2 border border-gray-100 rounded p-2">
                                      <div className={`flex-shrink-0 w-6 h-6 rounded-full mt-1 grid place-items-center ${answer.is_correct ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {i + 1}
                                      </div>
                                      <div className="flex-grow">
                                        <p className="text-sm">{answer.text}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          <span className={answer.is_correct ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                            {answer.is_correct ? '✓ Correct Answer' : 'Incorrect Option'}
                                          </span>
                                          {' · '}
                                          ID: {answer.id}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {questionType === 'matching' && (
                                <div className="col-span-2">
                                  <table className="w-full text-sm border-collapse">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="p-2 border text-left">#</th>
                                        <th className="p-2 border text-left">Left Side</th>
                                        <th className="p-2 border text-left">Right Side</th>
                                        <th className="p-2 border text-left">Item ID</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {answers.map((pair: any, i: number) => (
                                        <tr key={pair.id} className="hover:bg-gray-50">
                                          <td className="p-2 border">{i + 1}</td>
                                          <td className="p-2 border">{pair.left_text}</td>
                                          <td className="p-2 border">{pair.right_text}</td>
                                          <td className="p-2 border text-xs text-gray-500">{pair.id}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              
                              {questionType === 'sequence' && (
                                <div className="col-span-2">
                                  <table className="w-full text-sm border-collapse">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="p-2 border text-left">Correct Position</th>
                                        <th className="p-2 border text-left">Content</th>
                                        <th className="p-2 border text-left">Item ID</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {answers.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                          <td className="p-2 border">{item.correct_position}</td>
                                          <td className="p-2 border">{item.text}</td>
                                          <td className="p-2 border text-xs text-gray-500">{item.id}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              
                              {questionType === 'drag-drop' && (
                                <div className="col-span-2">
                                  <table className="w-full text-sm border-collapse">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="p-2 border text-left">#</th>
                                        <th className="p-2 border text-left">Content</th>
                                        <th className="p-2 border text-left">Target Zone</th>
                                        <th className="p-2 border text-left">Item ID</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {answers.map((item: any, i: number) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                          <td className="p-2 border">{i + 1}</td>
                                          <td className="p-2 border">{item.content}</td>
                                          <td className="p-2 border">{item.target_zone}</td>
                                          <td className="p-2 border text-xs text-gray-500">{item.id}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="ml-10 mt-2 p-3 bg-gray-50 text-gray-500 rounded text-sm">
                            No answer options found for this {questionType} question. This may be normal if the question is incomplete or doesn't require options.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (testData?.questions?.length || 0) > 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No answer options loaded yet</p>
                  <button 
                    onClick={fetchAnswers}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Fetch Answer Options
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Load test questions first, then fetch answer options.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-semibold">Diagnostics</h2>
              {!diagnosticsLoading && !diagnosticResults && (
                <button
                  onClick={runDiagnostics}
                  className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                >
                  Run Diagnostics
                </button>
              )}
            </div>
            <div className="p-4">
              {diagnosticsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Running diagnostic tests...
                </div>
              ) : diagnosticResults ? (
                <div className="space-y-6">
                  {/* Question Type Support Section */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h3 className="font-medium">Question Type Support</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {diagnosticResults.questionTypeSupport && diagnosticResults.questionTypeSupport.results && Object.entries(diagnosticResults.questionTypeSupport.results).map(([type, result]: [string, any]) => (
                          <div key={type} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{type}</span>
                              <span className={`inline-block px-2 py-1 text-xs rounded ${result.supported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {result.supported ? 'Supported' : 'Not Supported'}
                              </span>
                            </div>
                            {result.supported && (
                              <p className="text-sm text-gray-600">Records: {result.records || 'N/A'}</p>
                            )}
                            {!result.supported && result.error && (
                              <p className="text-xs text-red-600 mt-1 overflow-hidden overflow-ellipsis">
                                Error: {result.error.message || JSON.stringify(result.error)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Comparison Section */}
                  {diagnosticResults.performanceComparison && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h3 className="font-medium">Performance Comparison</h3>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-center mb-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {diagnosticResults.performanceComparison.improvement > 0 ? '+' : ''}
                              {diagnosticResults.performanceComparison.improvement}%
                            </div>
                            <p className="text-sm text-gray-600">
                              {diagnosticResults.performanceComparison.fasterMethod === 'optimized' ? 
                                'Faster with optimized loading' : 
                                'Faster with standard loading'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded p-3">
                            <h4 className="font-medium mb-2">Standard Loading</h4>
                            <p className="text-sm">Duration: {Math.round(diagnosticResults.performanceComparison.standardDuration)}ms</p>
                            {diagnosticResults.traceTestLoading && (
                              <p className="text-sm mt-1">Steps: {diagnosticResults.traceTestLoading.trace?.length || 0}</p>
                            )}
                          </div>
                          
                          <div className="border rounded p-3">
                            <h4 className="font-medium mb-2">Optimized Loading</h4>
                            <p className="text-sm">Duration: {Math.round(diagnosticResults.performanceComparison.optimizedDuration)}ms</p>
                            {diagnosticResults.optimizedLoading && (
                              <>
                                <p className="text-sm mt-1">Questions: {diagnosticResults.optimizedLoading.questionCount || 0}</p>
                                <p className="text-sm">Answers: {diagnosticResults.optimizedLoading.answerCount || 0}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Trace Test Loading Section */}
                  {diagnosticResults.traceTestLoading && diagnosticResults.traceTestLoading.trace && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h3 className="font-medium">Test Loading Trace</h3>
                      </div>
                      <div className="overflow-auto max-h-80">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 text-left font-medium text-gray-700">Step</th>
                              <th className="p-3 text-left font-medium text-gray-700">Status</th>
                              <th className="p-3 text-left font-medium text-gray-700">Duration</th>
                              <th className="p-3 text-left font-medium text-gray-700">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {diagnosticResults.traceTestLoading.trace.map((step: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="p-3">{step.step}</td>
                                <td className="p-3">
                                  <span className={`inline-block px-2 py-1 text-xs rounded ${step.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {step.success ? 'Success' : 'Failed'}
                                  </span>
                                </td>
                                <td className="p-3">{Math.round(step.duration)}ms</td>
                                <td className="p-3">
                                  {step.data && (
                                    <details>
                                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                        View Details
                                      </summary>
                                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                                        {JSON.stringify(step.data, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Diagnostic Summary */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-800 mb-2">Diagnostic Summary</h3>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      {diagnosticResults.questionTypeSupport && (
                        <li>
                          Question Type Support: 
                          {Object.values(diagnosticResults.questionTypeSupport.results).filter((r: any) => r.supported).length} / 
                          {Object.values(diagnosticResults.questionTypeSupport.results).length} types supported
                        </li>
                      )}
                      {diagnosticResults.traceTestLoading && (
                        <li>
                          Test Loading: 
                          {diagnosticResults.traceTestLoading.success ? ' Successful' : ' Failed'} 
                          {diagnosticResults.traceTestLoading.testData ? 
                            ` (${diagnosticResults.traceTestLoading.testData.questions?.length || 0} questions)` : 
                            ''}
                        </li>
                      )}
                      {diagnosticResults.optimizedLoading && (
                        <li>
                          Optimized Loading: 
                          {diagnosticResults.optimizedLoading.success ? ' Successful' : ' Failed'}
                          {diagnosticResults.optimizedLoading.questionCount ? 
                            ` (${diagnosticResults.optimizedLoading.questionCount} questions, ${diagnosticResults.optimizedLoading.answerCount} answers)` : 
                            ''}
                        </li>
                      )}
                      {diagnosticResults.performanceComparison && (
                        <li>
                          Recommended approach: 
                          <strong>
                            {diagnosticResults.performanceComparison.fasterMethod === 'optimized' ? 
                              ' Optimized loading' : 
                              ' Standard loading'}
                          </strong>
                          {' for this test'}
                        </li>
                      )}
                    </ul>
                  </div>
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