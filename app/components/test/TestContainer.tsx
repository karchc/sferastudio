import { TestData, UserAnswer, Question } from "@/app/lib/types";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TestStartScreen } from "./TestStartScreen";
import { QuestionCard } from "./QuestionCard";
import { Timer } from "./Timer";
import { TestSummary } from "./TestSummary";
import { QuestionNavigation } from "./QuestionNavigation";
import { useNavbarVisibility } from "@/app/lib/useNavbarVisibility";

// Test phases
type TestPhase = "idle" | "in-progress" | "completed";

interface TestContainerProps {
  test: TestData;
  progress?: any;
  onProgress?: (progress: any) => void;
  onNavigate?: (path: string) => void;
  timeLeft?: number;
  isPreview?: boolean;
}

export function TestContainer({ test, onNavigate, timeLeft, isPreview = false }: TestContainerProps) {
  // Test state
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Control navbar visibility - hide only during "in-progress" phase
  useNavbarVisibility(phase !== "in-progress");

  // Handle test start
  const handleStart = () => {
    setPhase("in-progress");
    setStartTime(new Date());
    setTimeSpent(0);
    setUserAnswers([]);
  };

  // Handle test completion
  const handleComplete = () => {
    if (isPreview) {
      // For preview mode, navigate directly to completion page without showing summary
      if (onNavigate) {
        onNavigate(`/preview-test/${test.id}/complete`);
      }
      return;
    }
    
    // Regular test completion logic
    const answeredQuestionIds = userAnswers
      .filter(a => a.answers && a.answers.length > 0)
      .map(a => a.questionId);
    
    const skippedQuestions = test.questions.filter(
      q => !answeredQuestionIds.includes(q.id)
    );
    
    // If there are skipped questions, show confirmation
    if (skippedQuestions.length > 0 && confirm(
      `You have ${skippedQuestions.length} unanswered question(s). Are you sure you want to finish the test? Click 'Cancel' to return and answer these questions.`
    )) {
      setPhase("completed");
    } else if (skippedQuestions.length === 0) {
      // No skipped questions, proceed directly
      setPhase("completed");
    }
    // If user clicked cancel on confirmation, they stay on the test
  };

  // Handle question navigation
  const handleNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handle answer selection
  const handleAnswer = (answerId: string[]) => {
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
  };

  // Handle retry
  const handleRetry = () => {
    setPhase("idle");
    setCurrentQuestionIndex(0);
  };

  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    if (onNavigate) {
      onNavigate("/dashboard");
    }
  };

  // Handle flag toggle
  const handleFlagToggle = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newFlags = new Set(prev);
      if (newFlags.has(questionId)) {
        newFlags.delete(questionId);
      } else {
        newFlags.add(questionId);
      }
      return newFlags;
    });
  };

  // Calculate time spent
  useEffect(() => {
    if (phase === "in-progress" && startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
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
              />
              
              <div className="max-w-4xl mx-auto px-4">
                <QuestionNavigation
                  currentIndex={currentQuestionIndex}
                  totalQuestions={test.questions.length}
                  userAnswers={userAnswers}
                  flaggedQuestions={flaggedQuestions}
                  questionIds={test.questions.map(q => q.id)}
                  onNavigate={(index) => setCurrentQuestionIndex(index)}
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
    </div>
  );
}