"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, ArrowRight, Home } from "lucide-react";

interface Test {
  id: string;
  title: string;
  description?: string;
}

export default function PreviewTestCompletePage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch basic test info for display
    async function loadTestInfo() {
      try {
        const res = await fetch(`/api/test/${testId}/preview`);
        if (res.ok) {
          const data = await res.json();
          setTest({
            id: data.id,
            title: data.title.replace(' (Preview)', ''),
            description: data.description
          });
        }
      } catch (error) {
        console.error('Error loading test info:', error);
      }
      setLoading(false);
    }

    if (testId) {
      loadTestInfo();
    }
  }, [testId]);

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
              <p className="mt-4 text-lg">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Preview Test Completed!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            You have successfully completed the preview for {test?.title || 'this test'}.
          </p>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-800">Preview Mode Notice</h3>
            </div>
            <div className="text-blue-700 space-y-2">
              <p>• This was a preview test with limited questions</p>
              <p>• No scores or detailed results are provided in preview mode</p>
              <p>• To get full access to all questions and detailed analytics, purchase the complete test</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#3EB3E7] hover:bg-[#2da0d4] transition-all transform hover:scale-105"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </button>
            
            <button
              onClick={() => {
                // You can implement purchase flow here
                alert('Purchase functionality coming soon!');
              }}
              className="inline-flex items-center justify-center px-6 py-3 border border-[#3EB3E7] text-base font-medium rounded-md text-[#3EB3E7] bg-white hover:bg-[#3EB3E7] hover:text-white transition-all"
            >
              Purchase Full Test
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Ready to take the full test? Purchase access to get detailed performance analytics, 
              unlimited attempts, and comprehensive question explanations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}