"use client";

import Link from "next/link";
import { BookOpen, CheckCircle, Target, Clock, Users, Trophy, ArrowRight, Lightbulb, FileText, Brain, Star } from "lucide-react";
import { Footer } from "../components/Footer";

export default function StudyGuide() {
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
              <BookOpen className="h-4 w-4 text-[#3EB3E7] mr-2" />
              <span className="text-sm font-medium text-[#3EB3E7]">
                Comprehensive Study Resources
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Study Guide</span>
              <span className="block text-[#3EB3E7] mt-2">
                Master Your Certification
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Comprehensive resources and proven strategies to help you ace your SAP certification exams
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Expert Tips</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Proven Methods</span>
              </div>
              <div className="flex items-center">
                <Target className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Success Focused</span>
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

      {/* Study Strategies Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Effective Study Strategies
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Proven techniques to maximize your learning and exam performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#F6F7FA] rounded-lg p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Active Learning</h3>
              <p className="text-[#5C677D] mb-4">
                Engage with the material through practice questions, flashcards, and hands-on exercises
              </p>
              <ul className="text-sm text-[#5C677D] space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Take notes while studying
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Practice with real scenarios
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Test yourself regularly
                </li>
              </ul>
            </div>
            
            <div className="bg-[#F6F7FA] rounded-lg p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Time Management</h3>
              <p className="text-[#5C677D] mb-4">
                Create a structured study schedule and stick to it for consistent progress
              </p>
              <ul className="text-sm text-[#5C677D] space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Set daily study goals
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Use the Pomodoro Technique
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Review progress weekly
                </li>
              </ul>
            </div>
            
            <div className="bg-[#F6F7FA] rounded-lg p-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#0B1F3A]">Focused Practice</h3>
              <p className="text-[#5C677D] mb-4">
                Identify weak areas and concentrate your efforts on improving them
              </p>
              <ul className="text-sm text-[#5C677D] space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Analyze practice test results
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Focus on problem areas
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Track improvement over time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Study Resources Section */}
      <section className="py-16 bg-[#F6F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Study Resources
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Essential materials and tools to support your exam preparation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mr-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold text-[#0B1F3A]">Official Documentation</h3>
              </div>
              <p className="text-[#5C677D] mb-4">
                Start with the official SAP documentation and certification guides
              </p>
              <ul className="text-sm text-[#5C677D] space-y-2">
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  SAP Learning Hub
                </li>
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Official certification guides
                </li>
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Product documentation
                </li>
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Release notes and updates
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mr-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-semibold text-[#0B1F3A]">Practice Materials</h3>
              </div>
              <p className="text-[#5C677D] mb-4">
                Reinforce your learning with hands-on practice and mock exams
              </p>
              <ul className="text-sm text-[#5C677D] space-y-2">
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Practice tests and mock exams
                </li>
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Hands-on exercises
                </li>
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Case studies and scenarios
                </li>
                <li className="flex items-start">
                  <Star className="h-4 w-4 text-[#3EB3E7] mr-2 mt-0.5 flex-shrink-0" />
                  Flashcards and quick reviews
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Tips Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Exam Day Tips
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Essential advice for performing your best on the actual exam
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-[#3EB3E7] to-[#2da0d4] rounded-lg p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <Lightbulb className="h-8 w-8 mr-3" />
                  <h3 className="text-xl font-semibold">Before the Exam</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Get a good night's sleep
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Arrive early to the test center
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Review key concepts
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Stay calm and confident
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <Clock className="h-8 w-8 mr-3" />
                  <h3 className="text-xl font-semibold">During the Exam</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Read questions carefully
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Manage your time effectively
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Answer easy questions first
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Review your answers
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <Target className="h-8 w-8 mr-3" />
                  <h3 className="text-xl font-semibold">Test Strategy</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Eliminate wrong answers
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Use process of elimination
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Trust your first instinct
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Don't leave questions blank
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#0B1F3A] to-[#1a3454]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Practicing?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Put these study strategies into action with our comprehensive practice tests
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-[#0B1F3A] bg-white hover:bg-[#F6F7FA] transition-all transform hover:scale-105 shadow-lg"
          >
            Start Practicing Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}