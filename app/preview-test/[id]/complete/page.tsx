"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, ArrowRight, Home, ShoppingCart } from "lucide-react";
import { PurchaseModal } from "@/app/components/ui/purchase-modal";
import { AuthRequiredModal } from "@/app/components/ui/auth-required-modal";
import { useAuth } from "@/app/lib/auth-context";

interface Test {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
}

export default function PreviewTestCompletePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const testId = params?.id as string;
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [purchasingTestId, setPurchasingTestId] = useState<string | null>(null);

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
            description: data.description,
            time_limit: data.time_limit || 0
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

  const handlePurchase = () => {
    if (!test) return;

    if (!user) {
      // User not logged in, show auth modal
      setShowAuthModal(true);
      return;
    }

    // User is logged in, show purchase confirmation modal
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!test) return;

    setPurchasingTestId(test.id);
    try {
      // Add test to user's library
      const response = await fetch('/api/user/purchased-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_id: test.id,
          status: 'active'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowPurchaseModal(false);
        
        // Show success message using a temporary notification
        const successMessage = result.message || 'Test successfully added to your library!';
        
        // Create a temporary success notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-[10000] flex items-center gap-2';
        notification.innerHTML = `
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          ${successMessage}
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        const error = await response.json();
        if (error.error === 'You already own this test') {
          setShowPurchaseModal(false);
          
          // Show info message
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-[10000] flex items-center gap-2';
          notification.innerHTML = `
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            You already own this test! Redirecting to your dashboard...
          `;
          document.body.appendChild(notification);
          
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
          
          router.push('/dashboard');
        } else {
          alert(`Error: ${error.error || 'Failed to purchase test'}`);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('An error occurred while purchasing the test. Please try again.');
    } finally {
      setPurchasingTestId(null);
    }
  };

  const handleClosePurchaseModal = () => {
    setShowPurchaseModal(false);
    setPurchasingTestId(null);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
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
              onClick={handlePurchase}
              disabled={purchasingTestId === testId}
              className="inline-flex items-center justify-center px-6 py-3 border border-[#3EB3E7] text-base font-medium rounded-md text-[#3EB3E7] bg-white hover:bg-[#3EB3E7] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasingTestId === testId ? (
                <>Purchasing...</>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Purchase Full Test
                </>
              )}
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

      {/* Modals */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onConfirm={handleConfirmPurchase}
        test={test || { id: '', title: '', time_limit: 0 }}
        isLoading={purchasingTestId === test?.id}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        test={test || undefined}
      />
    </main>
  );
}