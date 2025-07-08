"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Trophy, Target, Clock, Users, CheckCircle, ArrowRight, Zap, Award, TrendingUp, Eye, ShoppingCart } from "lucide-react";
import { Button } from "./components/ui/button";
import { PurchaseModal } from "./components/ui/purchase-modal";
import { AuthRequiredModal } from "./components/ui/auth-required-modal";
import { useAuth } from "./lib/auth-context";

interface Test {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
  question_count?: number;
  is_active: boolean;
  tag?: string;
  categories?: Array<{ id: string; name: string }>;
}

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingTestId, setPurchasingTestId] = useState<string | null>(null);
  const [previewingTestId, setPreviewingTestId] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTests() {
      try {
        console.log('📡 Fetching tests...');
        const testsResponse = await fetch('/api/tests/public');
        
        if (!isMounted) return;
        
        if (!testsResponse.ok) {
          console.error("Error fetching tests:", testsResponse.status);
        } else {
          const testsData = await testsResponse.json();
          setTests(testsData || []);
          console.log(`✅ Loaded ${testsData?.length || 0} tests`);
        }
      } catch (error) {
        console.error("Error loading tests:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTests();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount


  const handlePurchase = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setSelectedTest(test);

    if (!user) {
      // User not logged in, show auth modal
      setShowAuthModal(true);
      return;
    }

    // User is logged in, show purchase confirmation modal
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedTest) return;

    setPurchasingTestId(selectedTest.id);
    try {
      // Add test to user's library
      const response = await fetch('/api/user/purchased-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_id: selectedTest.id,
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
    setSelectedTest(null);
    setPurchasingTestId(null);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setSelectedTest(null);
  };

  const handlePreviewClick = (testId: string) => {
    setPreviewingTestId(testId);
    router.push(`/preview-test/${testId}`);
  };

  // Show loading state only for test data, not auth
  // Auth loading is handled by the navigation component
  if (loading && !authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="mt-4 text-lg">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0B1F3A] via-[#1a3454] to-[#0f2847] text-white overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A]/90 to-[#1a3454]/90"></div>
          
          {/* Floating Geometric Shapes */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#3EB3E7]/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-[#B1E5D3]/20 rounded-lg animate-bounce delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-[#3EB3E7]/15 rotate-45 animate-spin delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-[#B1E5D3]/10 rounded-full animate-pulse delay-500"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-[#3EB3E7]/20 backdrop-blur-sm rounded-full border border-[#3EB3E7]/30 mb-6">
                <Zap className="h-4 w-4 text-[#3EB3E7] mr-2" />
                <span className="text-sm font-medium text-[#3EB3E7]">
                  #1 SAP Certification Prep Platform
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
                <span className="block animate-fade-in-up">Master the Test.</span>
                <span className="block text-[#3EB3E7] mt-2 animate-fade-in-up delay-200">
                  One Question at a Time.
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto lg:mx-0 opacity-90 animate-fade-in-up delay-400">
                Practice Smarter. Score Higher. Join <span className="text-[#3EB3E7] font-semibold">10,000+</span> professionals who aced their SAP certifications.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8 animate-fade-in-up delay-600">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-[#B1E5D3] mr-2" />
                  <span className="text-sm">98% Pass Rate</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-[#B1E5D3] mr-2" />
                  <span className="text-sm">10,000+ Students</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-[#B1E5D3] mr-2" />
                  <span className="text-sm">Expert Curated</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-800">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="group inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-lg text-white bg-[#3EB3E7] hover:bg-[#2da0d4] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-[#2da0d4] to-[#3EB3E7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="relative">Start Practicing Now</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                    {!profile?.is_admin && (
                      <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-base font-medium rounded-lg text-white hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
                      >
                        <TrendingUp className="mr-2 h-5 w-5" />
                        My Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signup"
                      className="group inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-lg text-white bg-[#3EB3E7] hover:bg-[#2da0d4] transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-[#2da0d4] to-[#3EB3E7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="relative">Get Started Free</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-base font-medium rounded-lg text-white hover:bg-white/10 hover:border-white transition-all duration-300 backdrop-blur-sm"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Visual Elements */}
            <div className="relative lg:block hidden">
              <div className="relative">
                {/* Main Visual Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3EB3E7] rounded-full mb-4">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Practice Questions</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Real exam scenarios with instant feedback
                    </p>
                    <div className="bg-[#B1E5D3]/20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-[#3EB3E7]">5,000+</div>
                      <div className="text-xs text-white/70">Active Questions</div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -top-6 -right-6 bg-[#B1E5D3] text-[#0B1F3A] rounded-full p-4 animate-bounce">
                  <div className="text-center">
                    <div className="font-bold text-lg">98%</div>
                    <div className="text-xs">Success</div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-[#3EB3E7] text-white rounded-lg p-3 animate-pulse">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Timed Tests</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 70C840 80 960 100 1080 110C1200 120 1320 120 1380 120L1440 120V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#F6F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Why Choose Practice SAP?
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Everything you need to ace your certification exams
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Real Exam Questions</h3>
              <p className="text-[#5C677D]">
                Practice with actual exam questions from SAP and Business Tech certifications
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Detailed Analytics</h3>
              <p className="text-[#5C677D]">
                Track your performance, identify weak areas, and improve with targeted practice
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Timed Practice</h3>
              <p className="text-[#5C677D]">
                Simulate real exam conditions with timed tests and automatic submission
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mb-4">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Progress Tracking</h3>
              <p className="text-[#5C677D]">
                Monitor your improvement over time with comprehensive progress reports
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Expert Content</h3>
              <p className="text-[#5C677D]">
                Questions curated by certified professionals and industry experts
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Instant Feedback</h3>
              <p className="text-[#5C677D]">
                Get immediate results and explanations for every question
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Tests Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Available Practice Tests
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Choose from our comprehensive collection of certification practice exams
            </p>
          </div>
          
          {tests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test: Test) => (
                <div 
                  key={test.id} 
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-transparent hover:border-[#3EB3E7] flex flex-col h-full"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-[#0B1F3A]">
                          {test.title}
                        </h3>
                      </div>
                      {test.tag && (
                        <span className="inline-block px-3 py-1 text-xs font-medium text-[#0B1F3A] bg-[#B1E5D3] rounded-full">
                          {test.tag}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[#5C677D] mb-4 flex-1 line-clamp-3">
                      {test.description || 'Test your knowledge and prepare for certification'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-[#5C677D] mb-6">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.floor(test.time_limit / 60)} mins
                      </span>
                      <span>{test.question_count || 25} questions</span>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="default"
                        className="flex-1 border-[#3EB3E7] text-[#3EB3E7] hover:bg-[#3EB3E7] hover:text-white"
                        loading={previewingTestId === test.id}
                        loadingText="Loading..."
                        onClick={() => handlePreviewClick(test.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview Test
                      </Button>
                      <Button
                        variant="default"
                        size="default"
                        className="flex-1 bg-[#3EB3E7] hover:bg-[#2da0d4]"
                        loading={purchasingTestId === test.id}
                        loadingText="Purchasing..."
                        onClick={() => handlePurchase(test.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Purchase Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No tests available at the moment.</p>
              <p className="text-sm text-gray-500">Check back soon for new content!</p>
            </div>
          )}
          
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#0B1F3A] to-[#1a3454]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Ace Your Certification?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Join thousands of professionals who have successfully passed their exams with Practice SAP
          </p>
          {!user && (
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-[#0B1F3A] bg-white hover:bg-[#F6F7FA] transition-all transform hover:scale-105 shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1F3A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Practice SAP</h3>
              <p className="text-gray-400">
                Your trusted partner for certification exam preparation
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/prep-exam" className="text-gray-400 hover:text-white transition-colors">
                    Prep Exam
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Study Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms & Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Practice SAP. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onConfirm={handleConfirmPurchase}
        test={selectedTest || { id: '', title: '', time_limit: 0 }}
        isLoading={purchasingTestId === selectedTest?.id}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        test={selectedTest || undefined}
      />
    </div>
  );
}