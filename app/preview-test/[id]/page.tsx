"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TestData } from "@/app/lib/types";
import { TestContainer } from "@/app/components/test/TestContainer";

const LOCAL_STORAGE_KEY = (testId: string) => `preview-test-progress-${testId}`;

export default function PreviewTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [progress, setProgress] = useState<any>(null);

  // Load preview test data
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
          
          // Use saved startTime if available, else set new
          const startTime = savedProgress?.startTime
            ? new Date(savedProgress.startTime)
            : new Date();
          
          setTestData({
            ...data,
            sessionId: `preview-session-${Date.now()}`,
            startTime,
            timeRemaining: 1800, // 30 minutes
            isPreview: true
          });
          
          setProgress(savedProgress || { answers: {}, startTime });
          
          // If no saved progress, save initial state
          if (!savedProgress) {
            localStorage.setItem(
              LOCAL_STORAGE_KEY(testId),
              JSON.stringify({ answers: {}, startTime })
            );
          }
        }
      } catch (error) {
        console.error('Error loading preview test:', error);
        setTestData(null);
      }
      setLoading(false);
    }
    
    loadPreviewTestData();
  }, [testId]);

  // Handler to update progress
  const handleProgress = (newProgress: any) => {
    setProgress((prev: any) => {
      const updated = { ...prev, ...newProgress, startTime: prev.startTime };
      localStorage.setItem(LOCAL_STORAGE_KEY(testId), JSON.stringify(updated));
      return updated;
    });
  };

  // Calculate time left based on startTime (30 minutes max)
  const getTimeLeft = () => {
    if (!testData || !progress?.startTime) return 1800; // 30 minutes
    const elapsed = Math.floor((Date.now() - new Date(progress.startTime).getTime()) / 1000);
    return Math.max(1800 - elapsed, 0);
  };

  // Custom navigation handler for preview mode
  const handleNavigate = (path: string) => {
    // Clear preview progress when test is completed
    if (path.includes('complete') || path.includes('summary')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY(testId));
      // Redirect to a custom preview completion page
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
            This is a preview test with limited questions and a 30-minute time limit. 
            Your answers will not be saved or reviewed at the end.
          </p>
        </div>
      </div>
      
      <TestContainer
        test={testData}
        progress={progress}
        onProgress={handleProgress}
        onNavigate={handleNavigate}
        timeLeft={getTimeLeft()}
        isPreview={true}
      />
    </main>
  );
}