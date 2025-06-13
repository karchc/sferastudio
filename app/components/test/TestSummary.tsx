import { Question, TestData, UserAnswer } from "@/app/lib/types";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

interface TestSummaryProps {
  test: TestData;
  userAnswers: UserAnswer[];
  timeSpent: number;
  onRetry: () => void;
  onViewDashboard: () => void;
}

export function TestSummary({
  test,
  userAnswers,
  timeSpent,
  onRetry,
  onViewDashboard
}: TestSummaryProps) {
  // Calculate correct answers
  const result = calculateTestResult(test, userAnswers);
  const scorePercentage = Math.round((result.score / result.totalQuestions) * 100);
  
  // Categorize performance
  const getPerformanceLabel = () => {
    if (scorePercentage >= 90) return "Excellent";
    if (scorePercentage >= 75) return "Good";
    if (scorePercentage >= 60) return "Satisfactory";
    return "Needs Improvement";
  };

  const getPerformanceColor = () => {
    if (scorePercentage >= 90) return "text-green-600";
    if (scorePercentage >= 75) return "text-blue-600";
    if (scorePercentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Test Completed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-blue-50 p-6 mb-4">
              <span className={`text-4xl font-bold ${getPerformanceColor()}`}>
                {scorePercentage}%
              </span>
            </div>
            <h3 className={`text-xl font-medium ${getPerformanceColor()}`}>
              {getPerformanceLabel()}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              You answered {result.score} out of {result.totalQuestions} questions correctly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800">Time Spent</h4>
                <Clock className="h-5 w-5 text-blue-800" />
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {Math.round((timeSpent / test.timeLimit) * 100)}% of allowed time
              </p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Question Types</h4>
              <div className="space-y-2">
                {/* Count of each question type */}
                {['multiple-choice', 'single-choice', 'true-false', 'matching', 'sequence', 'drag-drop'].map(type => {
                  const count = test.questions.filter(q => q.type === type).length;
                  if (count === 0) return null;
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type.replace('-', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
                
                <hr className="my-1" />
                
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Answered</span>
                  <span>{userAnswers.filter(a => a.answers && a.answers.length > 0).length}/{test.questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Skipped</span>
                  <span>{test.questions.length - userAnswers.filter(a => a.answers && a.answers.length > 0).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Question Breakdown</h3>
            <div className="space-y-2">
              {test.questions.map((question, index) => {
                const userAnswer = userAnswers.find(a => a.questionId === question.id);
                // Use isCorrect from the answer if available (for non-standard question types)
                const isCorrect = userAnswer?.isCorrect !== undefined 
                  ? userAnswer.isCorrect 
                  : isAnswerCorrect(question, userAnswer);
                
                return (
                  <div 
                    key={question.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Q{index + 1}</span>
                      <div className="flex flex-col">
                        <span className="text-sm truncate max-w-[280px]">{question.text}</span>
                        <span className="text-xs text-gray-500">{question.type.replace('-', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!userAnswers.find(a => a.questionId === question.id) || 
                       !userAnswers.find(a => a.questionId === question.id)?.answers || 
                       userAnswers.find(a => a.questionId === question.id)?.answers.length === 0 ? (
                        <>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Skipped</span>
                        </>
                      ) : isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={onRetry} variant="outline" className="w-full">
            Retry Test
          </Button>
          <Button onClick={onViewDashboard} className="w-full">
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Helper functions
function calculateTestResult(test: TestData, userAnswers: UserAnswer[]): {
  testId: string;
  answers: UserAnswer[];
  startTime: Date;
  endTime: Date;
  score: number;
  totalQuestions: number;
} {
  let correctCount = 0;
  
  test.questions.forEach(question => {
    const userAnswer = userAnswers.find(a => a.questionId === question.id);
    if (isAnswerCorrect(question, userAnswer)) {
      correctCount++;
    }
  });
  
  return {
    testId: test.id,
    answers: userAnswers,
    startTime: new Date(), // Placeholder
    endTime: new Date(), // Placeholder
    score: correctCount,
    totalQuestions: test.questions.length
  };
}

function isAnswerCorrect(question: Question, userAnswer?: UserAnswer): boolean {
  // If no answer or empty answer, it's incorrect
  if (!userAnswer || !userAnswer.answers || userAnswer.answers.length === 0) return false;
  
  // Get correct answer IDs
  const correctAnswerIds = (question.answers || [])
    .filter((answer: any) => answer.isCorrect)
    .map((answer: any) => answer.id);
  
  // If counts don't match, quick false
  if (correctAnswerIds.length !== userAnswer.answers.length) return false;
  
  // Check if all user selected answers are correct
  return correctAnswerIds.every((id: any) => userAnswer.answers.includes(id))
    && userAnswer.answers.every((id: any) => correctAnswerIds.includes(id));
}