"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TestData } from "@/app/lib/types";
import { TestContainer } from "@/app/components/test/TestContainer";

export default function PreviewTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null); // Will be set when test starts
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Load preview test data - no session restoration
  useEffect(() => {
    if (!testId) return;
    setLoading(true);

    async function loadPreviewTestData() {
      try {
        const res = await fetch(`/api/test/${testId}/preview`);
        if (!res.ok) {
          setTestData(null);
        } else {
          const data = await res.json();

          // Check if there are preview questions available
          if (!data.questions || data.questions.length === 0) {
            setTestData({
              ...data,
              error: 'No preview questions available for this test.'
            });
            setLoading(false);
            return;
          }

          // Always start fresh - never restore progress
          setTestData({
            ...data,
            sessionId: `preview-session-${Date.now()}`,
            timeRemaining: data.timeLimit,
            isPreview: true
          });
        }
      } catch (error) {
        console.error('Error loading preview test:', error);
        setTestData(null);
      }
      setLoading(false);
    }

    loadPreviewTestData();
  }, [testId]); // Removed startTime from dependencies to prevent reload when timer starts

  // Update current time every second to trigger timer updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle phase changes - set start time when test begins
  const handlePhaseChange = (phase: string, phaseStartTime?: number) => {
    if (phase === "in-progress" && !startTime && phaseStartTime) {
      setStartTime(new Date(phaseStartTime));
      console.log('[Preview Timer] Timer started at:', new Date(phaseStartTime));
    }
  };

  // Calculate time left based on startTime and test's time limit
  // For preview mode, always calculate from the initial startTime
  const getTimeLeft = () => {
    if (!testData) return 1800; // Default fallback
    if (!startTime) return testData.timeLimit; // Timer hasn't started yet
    const elapsed = Math.floor((currentTime - startTime.getTime()) / 1000);
    return Math.max(testData.timeLimit - elapsed, 0);
  };

  // Custom navigation handler for preview mode
  const handleNavigate = (path: string) => {
    // Redirect to preview completion page when test is done
    if (path.includes('complete') || path.includes('summary')) {
      router.push(`/preview-test/${testId}/complete`);
    } else {
      router.push(path);
    }
  };

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
              <p className="mt-4 text-lg">Loading preview test...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!testData || testData.error) {
    return (
      <main className="py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Preview Test Not Available</h2>
          <p className="mb-6">
            {testData?.error || 'Unable to load preview test questions. Please try again later or contact support.'}
          </p>
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
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Preview Mode</h3>
          <p className="text-blue-700 text-sm">
            This is a preview test with limited questions.
            Your answers and progress will not be saved. Refreshing the page will restart the test.
          </p>
        </div>
      </div>

      <TestContainer
        test={testData}
        onNavigate={handleNavigate}
        onPhaseChange={handlePhaseChange}
        timeLeft={getTimeLeft()}
        isPreview={true}
      />
    </main>
  );
}