"use client";

import { useEffect, useState, useCallback } from "react";
import { TestContainer, TestPhase } from "@/app/components/test/TestContainer";
import { useRouter, useParams } from "next/navigation";
import { TestData } from "@/app/lib/types";
import { formatTimeLimit } from "@/app/lib/formatTimeLimit";

const LOCAL_STORAGE_KEY = (testId: string) => `test-progress-${testId}`;

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [progress, setProgress] = useState<any>(null); // You can type this as needed
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [testPhase, setTestPhase] = useState<TestPhase>("idle");
  const [actualStartTime, setActualStartTime] = useState<number | null>(null);
  const [accessError, setAccessError] = useState<{
    type: 'auth' | 'purchase' | 'error' | null;
    message: string;
    testInfo?: any;
  }>({ type: null, message: '' });

  // Load test data and progress
  useEffect(() => {
    if (!testId) return;
    setLoading(true);

    // Try to restore progress from localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY(testId));
    let savedProgress = null;
    if (saved) {
      try {
        savedProgress = JSON.parse(saved);
      } catch {}
    }

    async function loadTestData() {
      try {
        const res = await fetch(`/api/test/${testId}`);

        // Handle access errors (401 - auth required, 403 - purchase required)
        if (res.status === 401) {
          const errorData = await res.json();
          setAccessError({
            type: 'auth',
            message: errorData.message || 'You must be logged in to access this test',
            testInfo: errorData.testInfo,
          });
          setLoading(false);
          return;
        }

        if (res.status === 403) {
          const errorData = await res.json();
          setAccessError({
            type: 'purchase',
            message: errorData.message || 'This test requires purchase',
            testInfo: errorData.testInfo,
          });
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setTestData(null);
        } else {
          const data = await res.json();
          console.log("Test data loaded:", {
            title: data.title,
            timeLimit: data.timeLimit,
            timeLimitInMinutes: data.timeLimit / 60
          });
          setTestData({
            ...data,
            sessionId: `session-${Date.now()}`,
            timeRemaining: data.timeLimit,
          });

          const initialProgress = savedProgress || {
            answers: [],
            phase: "idle",
            currentQuestionIndex: 0,
            flaggedQuestions: [],
            timeSpent: 0,
            startTime: null
          };

          setProgress(initialProgress);

          // Restore session state if there was saved progress
          if (savedProgress) {
            console.log('Restoring test session:', savedProgress);
            if (savedProgress.phase) {
              setTestPhase(savedProgress.phase);
            }
            if (savedProgress.startTime) {
              setActualStartTime(new Date(savedProgress.startTime).getTime());
            }
          }

          // If no saved progress, save initial state
          if (!savedProgress) {
            localStorage.setItem(
              LOCAL_STORAGE_KEY(testId),
              JSON.stringify(initialProgress)
            );
          }
        }
      } catch (error) {
        console.error('Error loading test:', error);
        setAccessError({
          type: 'error',
          message: 'An error occurred while loading the test',
        });
      }
      setLoading(false);
    }
    loadTestData();
    
    // Add debugging function to window for development
    if (typeof window !== 'undefined') {
      (window as any).clearTestSession = () => clearSession();
      (window as any).showTestSession = () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY(testId));
        console.log('Current session data:', saved ? JSON.parse(saved) : 'No session data');
      };
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Handler to update progress (call this from TestContainer when user answers)
  const handleProgress = (newProgress: any) => {
    setProgress((prev: any) => {
      const updated = { ...prev, ...newProgress };
      // Only preserve startTime if it exists
      if (prev?.startTime) {
        updated.startTime = prev.startTime;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY(testId), JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate time left based on actual test start time
  const getTimeLeft = () => {
    if (!testData || !actualStartTime || testPhase !== "in-progress") {
      console.log("getTimeLeft - returning initial time:", testData?.timeLimit);
      return testData?.timeLimit || 0;
    }
    const elapsed = Math.floor((Date.now() - actualStartTime) / 1000);
    const remaining = Math.max((testData.timeLimit || 0) - elapsed, 0);
    console.log("getTimeLeft - elapsed:", elapsed, "remaining:", remaining, "timeLimit:", testData.timeLimit);
    return remaining;
  };

  // Handle phase changes from TestContainer
  const handlePhaseChange = useCallback((phase: TestPhase, startTime?: number) => {
    setTestPhase(phase);
    if (phase === "in-progress" && startTime) {
      setActualStartTime(startTime);
      // Update progress with actual start time
      setProgress((prev: any) => ({
        ...prev,
        startTime: new Date(startTime),
        phase
      }));
    }
  }, []);

  // Handle session updates from TestContainer
  const handleSessionUpdate = useCallback((sessionData: any) => {
    setProgress(sessionData);
    // Save to localStorage immediately (unless completed - TestContainer handles clearing)
    if (sessionData.phase !== "completed") {
      localStorage.setItem(LOCAL_STORAGE_KEY(testId), JSON.stringify(sessionData));
    }
  }, [testId]);

  // Function to clear session (can be called manually if needed)
  const clearSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY(testId));
    setProgress({ 
      answers: [], 
      phase: "idle",
      currentQuestionIndex: 0,
      flaggedQuestions: [],
      timeSpent: 0,
      startTime: null
    });
    setTestPhase("idle");
    setActualStartTime(null);
    setTimeLeft(testData?.timeLimit || 0);
  };

  // Update timeLeft every second only when test is in progress
  useEffect(() => {
    if (testData && testPhase === "in-progress" && actualStartTime) {
      // Calculate time left function inline to avoid dependency issues
      const calculateTimeLeft = () => {
        const elapsed = Math.floor((Date.now() - actualStartTime) / 1000);
        const remaining = Math.max((testData.timeLimit || 0) - elapsed, 0);
        console.log("Timer update - elapsed:", elapsed, "remaining:", remaining, "timeLimit:", testData.timeLimit);
        return remaining;
      };
      
      // Set initial time
      setTimeLeft(calculateTimeLeft());
      
      // Update every second
      const interval = setInterval(() => {
        const newTimeLeft = calculateTimeLeft();
        setTimeLeft(newTimeLeft);
        
        // Stop interval if time is up
        if (newTimeLeft <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (testData && testPhase === "idle") {
      // Reset to full time when idle
      console.log("Setting initial timeLeft to:", testData.timeLimit);
      setTimeLeft(testData.timeLimit || 0);
    }
  }, [testData, testPhase, actualStartTime]);

  if (loading) {
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
              <p className="mt-4 text-lg">Loading test...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Handle access errors (auth required, purchase required)
  if (accessError.type) {
    return (
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {accessError.type === 'auth' && (
              <>
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Authentication Required</h2>
                <p className="text-gray-600 mb-2">{accessError.message}</p>
                {accessError.testInfo && (
                  <div className="my-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{accessError.testInfo.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{accessError.testInfo.description}</p>
                    <p className="text-lg font-bold text-blue-600">
                      {accessError.testInfo.currency || 'USD'} ${(accessError.testInfo.price || 0).toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </>
            )}

            {accessError.type === 'purchase' && (
              <>
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Premium Test</h2>
                <p className="text-gray-600 mb-2">{accessError.message}</p>
                {accessError.testInfo && (
                  <div className="my-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <h3 className="font-semibold text-xl mb-3">{accessError.testInfo.title}</h3>
                    <p className="text-sm text-gray-700 mb-4">{accessError.testInfo.description}</p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-3xl font-bold text-blue-600">
                        {accessError.testInfo.currency || 'USD'} ${(accessError.testInfo.price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-2 text-sm text-gray-600 justify-center">
                      <span className="inline-flex items-center">
                        <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Unlimited Access
                      </span>
                      <span className="inline-flex items-center">
                        <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Detailed Analytics
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => router.push(`/?purchase=${testId}`)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                  >
                    Purchase Test
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Browse Tests
                  </button>
                </div>
              </>
            )}

            {accessError.type === 'error' && (
              <>
                <div className="mb-6">
                  <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Error</h2>
                <p className="text-gray-600 mb-6">{accessError.message}</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Return to Home
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!testData) {
    return (
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Test Not Available</h2>
          <p className="mb-6">Unable to load test questions from the database. Please try again later or contact support.</p>
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

  return (
    <main className="py-12">
      <TestContainer
        test={testData}
        progress={progress}
        onProgress={handleProgress}
        onNavigate={(path: string) => {
          console.log('Navigation requested to:', path);
          router.push(path);
        }}
        timeLeft={timeLeft}
        onPhaseChange={handlePhaseChange}
        onSessionUpdate={handleSessionUpdate}
      />
    </main>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { TestContainer } from "@/app/components/test/TestContainer";
// import { useRouter, useParams } from "next/navigation";
// import { TestData } from "@/app/lib/types";
// import { createClientSupabase } from "@/app/supabase";
// import { createDirectSupabase } from "@/app/lib/direct-supabase";
// import { fetchTestWithQuestionsUltra } from "@/app/lib/ultra-optimized-test-fetcher";
// import { supabase } from "@/app/lib/supabaseClient";


// export default function TestPage() {
//   const router = useRouter();
//   const params = useParams();
//   const [loading, setLoading] = useState(true);
//   const [testData, setTestData] = useState<TestData | null>(null);
//   // Try both client methods - first try the direct client without auth wrappers
//   const directClient = createDirectSupabase();
//   const supabase = createClientSupabase();
  
//   const handleNavigate = (path: string) => {
//     router.push(path);
//   };

  
//   useEffect(() => {
//     // Test Supabase connection
//     const testConnection = async () => {
//       try {
//         // @ts-ignore - testConnection is a custom method we added for debugging
//         const result = await supabase.testConnection();
//         console.log('Supabase connection test:', result);
//       } catch (error) {
//         console.error('Error testing Supabase connection:', error);
//       }
//     };
    
//     testConnection();
    
//     // Set a much longer timeout as fallback - 2 minutes
//     const loadingTimeout = setTimeout(() => {
//       if (loading) {
//         console.error('Loading timeout reached after 2 minutes, showing default content');
//         const defaultData = {
//           id: 'default-test',
//           title: 'JavaScript Basics (Fallback)',
//           description: 'Test your knowledge of basic JavaScript concepts',
//           timeLimit: 900,
//           isActive: true,
//           questions: [{
//             id: 'default-q1',
//             text: 'What is JavaScript?',
//             type: 'single-choice',
//             answers: [
//               { id: 'default-a1', text: 'A programming language', isCorrect: true },
//               { id: 'default-a2', text: 'A markup language', isCorrect: false },
//               { id: 'default-a3', text: 'A database', isCorrect: false }
//             ]
//           }],
//           sessionId: `session-${Date.now()}`,
//           startTime: new Date(),
//           timeRemaining: 900
//         };
        
//         console.error('DATABASE FETCH TIMED OUT - Using default data');
//         console.error('Check network connectivity and Supabase service status');
        
//         setTestData(defaultData);
//         setLoading(false);
//       }
//     }, 120000); // 120 second timeout (2 minutes)
    
//     // Function to load test data using the optimized fetcher
//     async function loadTestData() {
//       console.group('Test Data Loading Process');
//       try {
//         // Get the test ID from URL parameters
//         const testId = params?.id as string;
//         if (!testId) {
//           console.error('No test ID provided in URL');
//           setLoading(false);
//           return;
//         }
//         try  {
//         console.log('Test ID from URL terai:', testId);
//         const { data, error}  = await supabase.from("questions").select("*");
//         console.log('Fetched testterai data:', data);
//       } catch(error) {
//           console.error('Error fetching test data:', error);
//         } 
        
//         console.log('Starting optimized test data load process for test ID:', testId);
        
//         // Try connection test to ensure Supabase is accessible
//         try {
//           const pingResult = await fetch('https://gezlcxtprkcceizadvre.supabase.co/rest/v1/', {
//             method: 'GET',
//             headers: {
//               'Content-Type': 'application/json',
//               'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
//             }
//           });
//           console.log('Supabase API ping result:', pingResult.status, pingResult.statusText);
//         } catch (e) {
//           console.error('Supabase connection test failed:', e);
//         }
        
//         // Start the fetch timer
//         console.time('fetch-optimized-test-data');
        
//         // Use the ultra-optimized fetcher that handles caching, batching, and fallbacks
//         const fetchedTestData = await fetchTestWithQuestionsUltra(testId);
        
//         console.timeEnd('fetch-optimized-test-data');
        
//         if (!fetchedTestData) {
//           console.error('Failed to fetch test data using the optimized fetcher');
          
//           // Create default fallback test
//           const defaultQuestions = [
//             {
//               id: 'default-q1',
//               text: 'What is JavaScript?',
//               type: 'single-choice',
//               answers: [
//                 { id: 'default-a1', text: 'A programming language', isCorrect: true },
//                 { id: 'default-a2', text: 'A markup language', isCorrect: false },
//                 { id: 'default-a3', text: 'A database', isCorrect: false }
//               ]
//             }
//           ];
          
//           // Set default test data to prevent infinite loading
//           const fallbackTestData = {
//             id: testId,
//             title: 'JavaScript Basics (Fallback)',
//             description: 'Test your knowledge of basic JavaScript concepts',
//             timeLimit: 900,
//             isActive: true,
//             questions: defaultQuestions,
//             sessionId: `session-${Date.now()}`,
//             startTime: new Date(),
//             timeRemaining: 900
//           };
          
//           console.error('Using fallback test data after optimized fetch failed');
//           setTestData(fallbackTestData);
//           setLoading(false);
//           return;
//         }
        
//         console.log('Successfully loaded test data using optimized fetcher');
//         console.log(`Test "${fetchedTestData.title}" has ${fetchedTestData.questions?.length || 0} questions`);
        
//         // Set the retrieved test data
//         setTestData(fetchedTestData);
//         setLoading(false);
        
//       } catch (error) {
//         console.error('Error in optimized test data loading:', error);
//         setLoading(false);
//       } finally {
//         console.groupEnd();
//       }
//     }
    
//     loadTestData();
    
//     // Clear timeout on cleanup
//     // Add function to reset stored data if needed
//     // Add window method to reset data (for debugging)
//     if (typeof window !== 'undefined') {
//       const anyWindow = window as any;
//       anyWindow.forceDbFetch = async () => {
//         console.log('Forcing DB fetch...');
//         loadTestData();
//       };
//     }
    
//     return () => clearTimeout(loadingTimeout);
//   }, [params]);
  
//   if (loading) {
//     return (
//       <main className="py-12">
//         <div className="max-w-2xl mx-auto px-4">
//           <div className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
//                 <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
//                   Loading...
//                 </span>
//               </div>
//               <p className="mt-4 text-lg">Loading test...</p>
//             </div>
//           </div>
//         </div>
//       </main>
//     );
//   }
  
//   if (!testData) {
//     return (
//       <main className="py-12">
//         <div className="max-w-2xl mx-auto px-4 text-center">
//           <h2 className="text-2xl font-bold mb-4">Test Not Available</h2>
//           <p className="mb-6">Unable to load test questions from the database. Please try again later or contact support.</p>
//           <button 
//             onClick={() => router.push('/')}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
//           >
//             Return to Home
//           </button>
//         </div>
//       </main>
//     );
//   }
  
//   return (
//     <main className="py-12">
//       <TestContainer 
//         test={testData} 
//         onNavigate={handleNavigate} 
//       />
//     </main>
//   );
// }