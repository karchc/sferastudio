'use client';

import { TestData, UserAnswer, Question } from "@/app/lib/types";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { TestStartScreen } from "./TestStartScreen";
import { QuestionCard } from "./QuestionCard";
// import { QuestionCard2 as QuestionCard } from "./QuestionCard2";
import { Timer } from "./Timer";
import { TestSummary } from "./TestSummary";
import { QuestionNavigation } from "./QuestionNavigation";
import { useNavbarVisibility } from "@/app/lib/useNavbarVisibility";
import { ConfirmationModal } from "../ui/confirmation-modal";

// Test phases
export type TestPhase = "idle" | "in-progress" | "completed";

interface TestContainerProps {
  test: TestData;
  progress?: any;
  onProgress?: (progress: any) => void;
  onNavigate?: (path: string) => void;
  timeLeft?: number;
  isPreview?: boolean;
  onPhaseChange?: (phase: TestPhase, startTime?: number) => void;
  onSessionUpdate?: (sessionData: any) => void;
}

export function TestContainer({ test, onNavigate, timeLeft, isPreview = false, onPhaseChange, onSessionUpdate, progress }: TestContainerProps) {
  // Test state - initialize from progress if available
  const [phase, setPhase] = useState<TestPhase>(progress?.phase || "idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(progress?.currentQuestionIndex || 0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>(progress?.answers || []);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set(progress?.flaggedQuestions || []));
  const [timeSpent, setTimeSpent] = useState(progress?.timeSpent || 0);
  const [startTime, setStartTime] = useState<number | null>(progress?.startTime ? new Date(progress.startTime).getTime() : null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [skippedQuestionsCount, setSkippedQuestionsCount] = useState(0);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  
  // Control navbar visibility - hide only during "in-progress" phase
  useNavbarVisibility(phase !== "in-progress");

  // Notify parent of phase changes
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(phase, startTime || undefined);
    }
  }, [phase, startTime, onPhaseChange]);

  // Notify parent of session updates - use useCallback to prevent infinite loops
  useEffect(() => {
    if (onSessionUpdate) {
      // Only update if there's a meaningful change
      const sessionData = {
        phase,
        currentQuestionIndex,
        answers: userAnswers,
        flaggedQuestions: Array.from(flaggedQuestions),
        timeSpent,
        startTime: startTime ? new Date(startTime) : null
      };
      
      // Debounce the update to prevent rapid firing
      const timeoutId = setTimeout(() => {
        onSessionUpdate(sessionData);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [phase, currentQuestionIndex, userAnswers.length, flaggedQuestions.size, timeSpent, startTime, onSessionUpdate]);

  // Function to save test results to database
  const saveTestResults = useCallback(async () => {
    if (!isPreview && dbSessionId) {
      try {
        // Create answers array for ALL questions (including unanswered ones)
        const allQuestionAnswers = test.questions.map(question => {
          const userAnswer = userAnswers.find(ua => ua.questionId === question.id);
          
          if (userAnswer) {
            // Question was answered
            return {
              questionId: question.id,
              questionType: question.type,
              questionText: question.text,
              answers: userAnswer.answers || [],
              isCorrect: userAnswer.isCorrect || false,
              timeSpent: userAnswer.timeSpent || 0
            };
          } else {
            // Question was skipped
            return {
              questionId: question.id,
              questionType: question.type,
              questionText: question.text,
              answers: [],
              isCorrect: false,
              timeSpent: 0
            };
          }
        });

        // Calculate correct stats
        const totalQuestions = test.questions.length;
        const answeredQuestions = userAnswers.filter(ua => ua.answers && ua.answers.length > 0);
        const correctCount = answeredQuestions.filter(ua => ua.isCorrect).length;
        const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        console.log('Saving test results:', {
          totalQuestions,
          answeredCount: answeredQuestions.length,
          correctCount,
          scorePercentage,
          skippedCount: totalQuestions - answeredQuestions.length
        });

        console.log('Data being sent to API:', {
          sessionId: dbSessionId,
          answers: allQuestionAnswers,
          totalQuestions: totalQuestions
        });

        console.log('Sample answer data:', allQuestionAnswers.slice(0, 3));

        // Save user answers to database
        await fetch('/api/test/session/answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: dbSessionId,
            answers: allQuestionAnswers,
            totalQuestions: totalQuestions
          }),
        });

        // Update session status to completed with correct score
        await fetch('/api/test/session', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: dbSessionId,
            status: 'completed',
            score: scorePercentage,
            timeSpent: timeSpent,
            endTime: new Date().toISOString()
          }),
        });

        console.log('Test results saved to database');
      } catch (error) {
        console.error('Error saving test results:', error);
      }
    }

    // Add small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 500));
    setPhase("completed");
    setIsCompleting(false);
  }, [isPreview, dbSessionId, userAnswers, timeSpent, test.questions]);

  // Handle test start
  const handleStart = async () => {
    setPhase("in-progress");
    const now = Date.now();
    setStartTime(now);
    setTimeSpent(0);
    setUserAnswers([]);

    // Create database session for non-preview tests
    if (!isPreview) {
      try {
        const response = await fetch('/api/test/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ testId: test.id }),
        });

        if (response.ok) {
          const data = await response.json();
          setDbSessionId(data.session.id);
          console.log('Database session created:', data.session.id);
        } else {
          console.error('Failed to create database session');
        }
      } catch (error) {
        console.error('Error creating database session:', error);
      }
    }
  };

  // Handle test completion
  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    
    if (isPreview) {
      // For preview mode, navigate directly to completion page without showing summary
      if (onNavigate) {
        onNavigate(`/preview-test/${test.id}/complete`);
      }
      setIsCompleting(false);
      return;
    }
    
    // Regular test completion logic
    const answeredQuestionIds = userAnswers
      .filter(a => a.answers && a.answers.length > 0)
      .map(a => a.questionId);
    
    const skippedQuestions = test.questions.filter(
      q => !answeredQuestionIds.includes(q.id)
    );
    
    // If there are skipped questions, show confirmation modal
    if (skippedQuestions.length > 0) {
      console.log('Showing skip confirmation modal for', skippedQuestions.length, 'questions');
      setSkippedQuestionsCount(skippedQuestions.length);
      setShowSkipConfirmation(true);
      setIsCompleting(false);
    } else {
      // No skipped questions, proceed directly
      await saveTestResults();
    }
  }, [isPreview, onNavigate, test.id, test.questions, userAnswers, saveTestResults]);

  // Handle confirmation from modal
  const handleConfirmSkip = useCallback(async () => {
    setShowSkipConfirmation(false);
    await saveTestResults();
  }, [saveTestResults]);

  // Handle cancel from modal
  const handleCancelSkip = useCallback(() => {
    setShowSkipConfirmation(false);
  }, []);

  // Handle question navigation
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentQuestionIndex, test.questions.length, handleComplete]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0 && test.allow_backward_navigation !== false) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex, test.allow_backward_navigation]);

  // Handle answer selection
  const handleAnswer = useCallback((answerId: string[]) => {
    const currentQuestion = test.questions[currentQuestionIndex];
    const questionId = currentQuestion.id;
    
    // Record if the answer is correct (for demo purposes and simple questions)
    let isCorrect = false;
    
    if (['multiple-choice', 'single-choice', 'true-false'].includes(currentQuestion.type)) {
      if (currentQuestion.type === 'multiple-choice') {
        // For multiple choice, all correct answers must be selected
        const correctAnswerIds = (currentQuestion.answers || [])
          .filter((a: any) => a.isCorrect)
          .map((a: any) => a.id);
          
        const userSelectedCorrectOnes = correctAnswerIds.every(id => answerId.includes(id));
        const userDidntSelectWrongOnes = answerId.every(id => 
          correctAnswerIds.includes(id) || !((currentQuestion.answers || []).find((a: any) => a.id === id) as any)?.isCorrect
        );
        
        isCorrect = userSelectedCorrectOnes && userDidntSelectWrongOnes;
      } else {
        // For single choice and true/false, check if the selected answer is correct
        if (answerId.length === 1) {
          const selectedAnswer = (currentQuestion.answers || []).find((a: any) => a.id === answerId[0]);
          isCorrect = (selectedAnswer as any)?.isCorrect || false;
        }
      }
    } else {
      // For other question types, we can't automatically determine correctness in this demo
      isCorrect = false;
    }
    
    setUserAnswers(prev => {
      // Check if this question was already answered
      const existingAnswerIndex = prev.findIndex(a => a.questionId === questionId);
      
      if (existingAnswerIndex >= 0) {
        // Update existing answer
        const newAnswers = [...prev];
        newAnswers[existingAnswerIndex] = { 
          ...newAnswers[existingAnswerIndex],
          answers: answerId,
          isCorrect: isCorrect,
          questionType: currentQuestion.type,
          questionText: currentQuestion.text
        };
        return newAnswers;
      } else {
        // Add new answer
        return [...prev, { 
          questionId: questionId,
          questionType: currentQuestion.type,
          questionText: currentQuestion.text,
          answers: answerId,
          isCorrect: isCorrect,
          timeSpent: 0 // We'll calculate this better in a future version
        }];
      }
    });
  }, [test.questions, currentQuestionIndex]);

  // Handle retry
  const handleRetry = () => {
    setPhase("idle");
    setCurrentQuestionIndex(0);
  };

  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    console.log('handleGoToDashboard called');
    console.log('onNavigate type:', typeof onNavigate);
    console.log('onNavigate:', onNavigate);
    
    try {
      if (onNavigate && typeof onNavigate === 'function') {
        console.log('Calling onNavigate with /dashboard');
        onNavigate("/dashboard");
      } else {
        console.warn('onNavigate not available, using window.location');
        // Direct navigation as fallback
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error during navigation:', error);
      // Force navigation as last resort
      window.location.href = '/dashboard';
    }
  };

  // Handle flag toggle
  const handleFlagToggle = useCallback((questionId: string) => {
    setFlaggedQuestions(prev => {
      const newFlags = new Set(prev);
      if (newFlags.has(questionId)) {
        newFlags.delete(questionId);
      } else {
        newFlags.add(questionId);
      }
      return newFlags;
    });
  }, []);

  // Calculate time spent
  useEffect(() => {
    if (phase === "in-progress" && startTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setTimeSpent(elapsed);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [phase, startTime]);

  return (
    <div className="min-h-screen pb-16">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <TestStartScreen 
            key="start" 
            test={test} 
            onStart={handleStart} 
          />
        )}
        
        {phase === "in-progress" && (
          <>
            <Timer 
              initialTime={isPreview ? 1800 : test.timeLimit}
              timeLeft={timeLeft}
              onTimeUp={handleComplete} 
            />
            <div className="pt-16">
              <QuestionCard
                key={`question-${currentQuestionIndex}`}
                question={test.questions[currentQuestionIndex]}
                currentAnswer={userAnswers.find(
                  a => a.questionId === test.questions[currentQuestionIndex].id
                )}
                onAnswer={handleAnswer}
                onNext={handleNextQuestion}
                onPrevious={handlePreviousQuestion}
                onFlagToggle={handleFlagToggle}
                isFlagged={flaggedQuestions.has(test.questions[currentQuestionIndex].id)}
                isFirst={currentQuestionIndex === 0}
                isLast={currentQuestionIndex === test.questions.length - 1}
                currentIndex={currentQuestionIndex}
                totalQuestions={test.questions.length}
                allowBackwardNavigation={test.allow_backward_navigation !== false}
                isCompleting={isCompleting}
              />
              
              <div className="max-w-4xl mx-auto px-4">
                <QuestionNavigation
                  currentIndex={currentQuestionIndex}
                  totalQuestions={test.questions.length}
                  userAnswers={userAnswers}
                  flaggedQuestions={flaggedQuestions}
                  questionIds={test.questions.map(q => q.id)}
                  onNavigate={(index) => {
                    // Only allow navigation if backward navigation is enabled or moving forward
                    if (test.allow_backward_navigation !== false || index > currentQuestionIndex) {
                      setCurrentQuestionIndex(index);
                    }
                  }}
                  allowBackwardNavigation={test.allow_backward_navigation !== false}
                />
              </div>
            </div>
          </>
        )}
        
        {phase === "completed" && (
          <TestSummary
            key="summary"
            test={test}
            userAnswers={userAnswers}
            timeSpent={timeSpent}
            onRetry={handleRetry}
            onViewDashboard={handleGoToDashboard}
          />
        )}
      </AnimatePresence>
      
      <ConfirmationModal
        isOpen={showSkipConfirmation}
        onClose={handleCancelSkip}
        onConfirm={handleConfirmSkip}
        title="Unanswered Questions"
        message={`You have ${skippedQuestionsCount} unanswered question(s). Are you sure you want to finish the test? You can go back to answer these questions.`}
        confirmText="Finish Test"
        cancelText="Go Back"
        variant="warning"
      />
    </div>
  );
}