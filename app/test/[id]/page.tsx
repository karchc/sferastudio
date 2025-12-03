"use client";

import { useEffect, useState, useCallback } from "react";
import { TestContainer, TestPhase } from "@/app/components/test/TestContainer";
import { useRouter, useParams } from "next/navigation";
import { TestData } from "@/app/lib/types";

const LOCAL_STORAGE_KEY = (testId: string) => `test-progress-${testId}`;

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);
  const [testPhase, setTestPhase] = useState<TestPhase>("idle");
  const [actualStartTime, setActualStartTime] = useState<number | null>(null);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<{
    type: 'auth' | 'purchase' | 'error' | null;
    message: string;
    testInfo?: any;
  }>({ type: null, message: '' });

  // Check for active database session and resume if found
  useEffect(() => {
    if (!testId) return;

    async function checkActiveSession() {
      try {
        const res = await fetch(`/api/test/session?testId=${testId}`);
        if (res.ok) {
          const { session } = await res.json();
          if (session && session.status === 'in_progress') {
            console.log('[Session Resume] Found active session:', session.id);

            // Check if session is expired
            const startTime = new Date(session.start_time).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);

            // We'll get time_limit from test data
            // For now, set the session ID and let it resume
            setDbSessionId(session.id);
            setActualStartTime(startTime);

            return session;
          } else if (session && (session.status === 'completed' || session.status === 'expired')) {
            // Session is completed - clear any stale localStorage and allow fresh start
            console.log('[Session Resume] Session already completed/expired, clearing localStorage');
            if (typeof window !== 'undefined') {
              localStorage.removeItem(LOCAL_STORAGE_KEY(testId));
              console.log('[Session Resume] Cleared stale localStorage for completed session');
            }
            return null;
          }
        }
      } catch (error) {
        console.error('[Session Resume] Error checking for active session:', error);
      }
      return null;
    }

    async function loadTestData() {
      setLoading(true);

      // First check for active session
      const activeSession = await checkActiveSession();

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

          // If we have an active session, resume from it
          if (activeSession) {
            console.log('[Session Resume] Resuming session with data:', activeSession);

            // Check if session is expired based on time
            const startTime = new Date(activeSession.start_time).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);

            if (elapsed >= data.timeLimit) {
              console.log('[Session Resume] Session has expired, allowing new attempt');
              // Session has expired - mark it as expired in database and clear localStorage
              try {
                await fetch('/api/test/session', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: activeSession.id,
                    status: 'expired',
                    endTime: new Date().toISOString()
                  }),
                });
                console.log('[Session Resume] Marked session as expired in database');
              } catch (error) {
                console.error('[Session Resume] Failed to mark session as expired:', error);
              }

              // Clear localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem(LOCAL_STORAGE_KEY(testId));
                console.log('[Session Resume] Cleared localStorage for expired session');
              }

              setDbSessionId(null);
              setActualStartTime(null);
            } else {
              // Try to get saved progress from localStorage
              const saved = localStorage.getItem(LOCAL_STORAGE_KEY(testId));
              console.log('[Session Resume] LocalStorage data:', saved);
              let savedProgress = null;
              if (saved) {
                try {
                  savedProgress = JSON.parse(saved);
                  console.log('[Session Resume] Parsed localStorage:', savedProgress);
                } catch (e) {
                  console.error('[Session Resume] Failed to parse localStorage:', e);
                }
              } else {
                console.log('[Session Resume] No localStorage found, using database session data');
              }

              // Merge database session with localStorage (prefer localStorage if more recent)
              const resumeProgress = savedProgress || {
                answers: [],
                phase: "in-progress",
                currentQuestionIndex: activeSession.current_question_index || 0,
                flaggedQuestions: activeSession.session_data?.flaggedQuestions || [],
                timeSpent: activeSession.time_spent || elapsed,
                startTime: new Date(activeSession.start_time)
              };

              console.log('[Session Resume] Setting progress to:', resumeProgress);
              setProgress(resumeProgress);
              setTestPhase("in-progress");
              setActualStartTime(startTime);
              console.log('[Session Resume] ✅ Test resumed successfully');
            }
          } else {
            // No active session, clear any stale localStorage and start fresh
            console.log('[Session Resume] No active session found, clearing localStorage');
            if (typeof window !== 'undefined') {
              localStorage.removeItem(LOCAL_STORAGE_KEY(testId));
            }

            const initialProgress = {
              answers: [],
              phase: "idle",
              currentQuestionIndex: 0,
              flaggedQuestions: [],
              timeSpent: 0,
              startTime: null
            };

            setProgress(initialProgress);
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

    // Add debugging functions
    if (typeof window !== 'undefined') {
      (window as any).clearTestSession = () => clearSession();
      (window as any).showTestSession = () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY(testId));
        console.log('Current session data:', saved ? JSON.parse(saved) : 'No session data');
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Update progress handler - also update database session
  const handleProgress = (newProgress: any) => {
    setProgress((prev: any) => {
      const updated = { ...prev, ...newProgress };
      if (prev?.startTime) {
        updated.startTime = prev.startTime;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY(testId), JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate time left based on actual test start time
  const getTimeLeft = () => {
    // If test hasn't started yet or no test data, return full time limit
    // This prevents the timer from triggering completion on initial load
    if (!testData) {
      return 3600; // Default 1 hour to prevent 0
    }

    if (!actualStartTime || testPhase !== "in-progress") {
      return testData.timeLimit; // Return full time limit, not 0
    }

    const elapsed = Math.floor((Date.now() - actualStartTime) / 1000);
    const remaining = Math.max((testData.timeLimit || 0) - elapsed, 0);

    console.log('[Time Calculation]', {
      elapsed,
      timeLimit: testData.timeLimit,
      remaining,
      actualStartTime: new Date(actualStartTime).toISOString()
    });

    return remaining;
  };

  // Handle phase changes from TestContainer
  const handlePhaseChange = useCallback((phase: TestPhase, startTime?: number) => {
    setTestPhase(phase);
    if (phase === "in-progress" && startTime) {
      setActualStartTime(startTime);
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

    // Save to localStorage immediately (unless completed)
    if (sessionData.phase !== "completed") {
      localStorage.setItem(LOCAL_STORAGE_KEY(testId), JSON.stringify(sessionData));

      // Also update database session if we have a session ID
      if (dbSessionId && sessionData.phase === "in-progress") {
        // Debounced update to database (don't await to avoid blocking UI)
        fetch('/api/test/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: dbSessionId,
            currentQuestionIndex: sessionData.currentQuestionIndex || 0,
            sessionData: {
              flaggedQuestions: sessionData.flaggedQuestions || [],
              answers: sessionData.answers || []
            }
          })
        }).catch(err => console.error('Error updating session:', err));
      }
    }
  }, [testId, dbSessionId]);

  // Set dbSessionId when it's created
  useEffect(() => {
    if (testPhase === "in-progress" && actualStartTime && !dbSessionId) {
      // Session should have been created by TestContainer
      // We can retrieve it from the progress data if needed
      console.log('[Session] Test in progress, session should be tracked');
    }
  }, [testPhase, actualStartTime, dbSessionId]);

  // Function to clear session
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
    setDbSessionId(null);
    setTimeLeft(testData?.timeLimit);
  };

  // Update timeLeft every second when test is in progress
  useEffect(() => {
    if (testData && testPhase === "in-progress" && actualStartTime) {
      const calculateTimeLeft = () => {
        const elapsed = Math.floor((Date.now() - actualStartTime) / 1000);
        const remaining = Math.max((testData.timeLimit || 0) - elapsed, 0);
        return remaining;
      };

      setTimeLeft(calculateTimeLeft());

      const interval = setInterval(() => {
        const newTimeLeft = calculateTimeLeft();
        setTimeLeft(newTimeLeft);

        if (newTimeLeft <= 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else if (testData && testPhase === "idle") {
      setTimeLeft(testData.timeLimit);
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
