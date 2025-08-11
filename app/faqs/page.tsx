"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Clock, Users, Trophy, ArrowRight, Search } from "lucide-react";
import { Footer } from "../components/Footer";

const faqs = [
  {
    category: "General",
    questions: [
      {
        question: "What is Practice SAP?",
        answer: "Practice SAP is a comprehensive exam preparation platform designed to help professionals prepare for SAP and Business Tech certification exams. We offer practice tests, study guides, and performance analytics to help you succeed."
      },
      {
        question: "How do I get started?",
        answer: "Simply create a free account, browse our available tests, and start practicing. You can preview tests before purchasing and track your progress through our dashboard."
      },
      {
        question: "What types of questions are included?",
        answer: "Our platform supports multiple question types including multiple choice, single choice, true/false, matching, sequence, and drag-and-drop questions to simulate real exam conditions."
      },
      {
        question: "Are the questions real exam questions?",
        answer: "Our questions are carefully crafted by certified professionals and industry experts to closely mirror the style, difficulty, and content of actual certification exams."
      }
    ]
  },
  {
    category: "Tests & Exams",
    questions: [
      {
        question: "How many practice tests are available?",
        answer: "We offer a growing library of practice tests covering various SAP modules and certification levels. New tests are added regularly based on user feedback and exam updates."
      },
      {
        question: "How long are the practice tests?",
        answer: "Test duration varies by certification type, typically ranging from 90 to 180 minutes, matching the actual exam time limits."
      },
      {
        question: "Can I pause and resume a test?",
        answer: "Yes, you can pause and resume tests within the time limit. However, for the most realistic exam experience, we recommend completing tests in one sitting."
      },
      {
        question: "Do I get immediate feedback?",
        answer: "Yes, you receive immediate feedback after completing each test, including detailed explanations for correct and incorrect answers."
      },
      {
        question: "Can I retake tests?",
        answer: "Yes, you can retake purchased tests multiple times. Each attempt may include different randomized questions for varied practice."
      }
    ]
  },
  {
    category: "Subscription & Pricing",
    questions: [
      {
        question: "What's the difference between free and paid tiers?",
        answer: "The free tier includes access to fixed practice questions. The paid tier offers randomized questions, detailed performance analytics, time tracking per question, and identification of problem areas."
      },
      {
        question: "How much does it cost?",
        answer: "We offer competitive pricing for individual tests and subscription plans. Visit our pricing page or contact us for current rates and enterprise options."
      },
      {
        question: "Is there a free trial?",
        answer: "Yes, you can preview any test before purchasing and access our free tier content. This gives you a good sense of our platform's quality and features."
      },
      {
        question: "Can I get a refund?",
        answer: "We offer refunds within 30 days of purchase if you're not satisfied with your experience. Please contact our support team for assistance."
      }
    ]
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "What browsers are supported?",
        answer: "Our platform works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience."
      },
      {
        question: "Can I use it on mobile devices?",
        answer: "Yes, our platform is fully responsive and works on tablets and smartphones. However, we recommend using a desktop or laptop for the best exam simulation experience."
      },
      {
        question: "What if I encounter technical issues?",
        answer: "If you experience any technical issues, please contact our support team immediately. We provide quick assistance and will ensure you can complete your tests without interruption."
      },
      {
        question: "How is my data protected?",
        answer: "We take data security seriously. All user data is encrypted, and we follow industry best practices for data protection and privacy."
      }
    ]
  },
  {
    category: "Performance & Analytics",
    questions: [
      {
        question: "How detailed are the performance analytics?",
        answer: "Our analytics provide comprehensive insights including overall scores, category-specific performance, time spent per question, question accuracy rates, and improvement trends over time."
      },
      {
        question: "Can I track my progress over time?",
        answer: "Yes, our dashboard shows your progress trends, performance improvements, and areas that need more attention, helping you focus your study efforts effectively."
      },
      {
        question: "Do you provide study recommendations?",
        answer: "Based on your performance data, we provide personalized study recommendations and identify weak areas that need more attention."
      },
      {
        question: "Can I export my results?",
        answer: "Yes, you can export your test results and performance data for your records or to share with instructors or employers."
      }
    ]
  }
];

export default function FAQs() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("General");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const toggleQuestion = (question: string) => {
    setExpandedQuestion(expandedQuestion === question ? null : question);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0B1F3A] via-[#1a3454] to-[#0f2847] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A]/90 to-[#1a3454]/90"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#3EB3E7]/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-[#B1E5D3]/20 rounded-lg animate-bounce delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-[#3EB3E7]/15 rotate-45 animate-spin delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-[#3EB3E7]/20 backdrop-blur-sm rounded-full border border-[#3EB3E7]/30 mb-6">
              <HelpCircle className="h-4 w-4 text-[#3EB3E7] mr-2" />
              <span className="text-sm font-medium text-[#3EB3E7]">
                Get Your Questions Answered
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Frequently Asked</span>
              <span className="block text-[#3EB3E7] mt-2">
                Questions
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Find answers to common questions about Practice SAP and our certification preparation platform
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Quick Support</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Community Driven</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Comprehensive Answers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 70C840 80 960 100 1080 110C1200 120 1320 120 1380 120L1440 120V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search FAQs..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3EB3E7] focus:border-[#3EB3E7] text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-[#F6F7FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {filteredFaqs.map((category) => (
              <div key={category.category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full px-6 py-4 text-left bg-[#3EB3E7] text-white hover:bg-[#2da0d4] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3EB3E7] focus:ring-offset-2"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{category.category}</h2>
                    {expandedCategory === category.category ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>
                
                {expandedCategory === category.category && (
                  <div className="p-6 space-y-4">
                    {category.questions.map((faq, index) => (
                      <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleQuestion(`${category.category}-${index}`)}
                          className="w-full text-left py-2 focus:outline-none focus:ring-2 focus:ring-[#3EB3E7] rounded"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-[#0B1F3A] pr-4">
                              {faq.question}
                            </h3>
                            {expandedQuestion === `${category.category}-${index}` ? (
                              <ChevronUp className="h-4 w-4 text-[#3EB3E7] flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[#3EB3E7] flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        
                        {expandedQuestion === `${category.category}-${index}` && (
                          <div className="mt-3 text-[#5C677D] leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No FAQs found matching your search.</p>
              <p className="text-sm text-gray-500 mt-2">Try different keywords or browse all categories.</p>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#3EB3E7] to-[#2da0d4] rounded-lg p-8 text-white">
            <HelpCircle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Can't find what you're looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-[#3EB3E7] transition-all rounded-lg font-medium"
              >
                Contact Support
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#3EB3E7] hover:bg-gray-100 transition-all rounded-lg font-medium"
              >
                Visit Help Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}