import { Question, TestData, UserAnswer } from "@/app/lib/types";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle, Clock, XCircle } from "lucide-react";

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
          <p className="text-lg font-semibold text-slate-700 mt-2">{test.title}</p>
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
              <h4 className="font-medium mb-2">Performance by Category</h4>
              <div className="space-y-3">
                {/* Category-based performance breakdown */}
                {(() => {
                  // Group questions by category
                  const categoryPerformance = new Map();
                  
                  test.questions.forEach(question => {
                    const categoryId = question.categoryId || question.category_id;
                    const categoryName = question.category?.name || 'Uncategorized';
                    
                    if (!categoryPerformance.has(categoryId || 'uncategorized')) {
                      categoryPerformance.set(categoryId || 'uncategorized', {
                        name: categoryName,
                        total: 0,
                        correct: 0,
                        answered: 0
                      });
                    }
                    
                    const category = categoryPerformance.get(categoryId || 'uncategorized');
                    category.total++;
                    
                    const userAnswer = userAnswers.find(a => a.questionId === question.id);
                    
                    if (userAnswer && userAnswer.answers && userAnswer.answers.length > 0) {
                      category.answered++;
                      
                      // For dropdown questions, always use calculated result since DB validation is unreliable
                      const isCorrect = question.type === 'dropdown' 
                        ? isAnswerCorrect(question, userAnswer)
                        : (userAnswer?.isCorrect !== undefined 
                            ? userAnswer.isCorrect 
                            : isAnswerCorrect(question, userAnswer));
                      
                      if (isCorrect) {
                        category.correct++;
                      }
                    }
                  });
                  
                  return Array.from(categoryPerformance.values()).map((category, index) => {
                    const percentage = category.answered > 0 ? Math.round((category.correct / category.answered) * 100) : 0;
                    const getPerformanceColor = (pct: number) => {
                      if (pct >= 80) return "text-green-600";
                      if (pct >= 60) return "text-yellow-600";
                      return "text-red-600";
                    };
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className={`text-sm font-bold ${getPerformanceColor(percentage)}`}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{category.correct}/{category.answered} correct</span>
                          <span>{category.total} questions</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              percentage >= 80 ? 'bg-green-500' : 
                              percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  });
                })()}
                
                <hr className="my-2" />
                
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Total Answered</span>
                  <span>{userAnswers.filter(a => a.answers && a.answers.length > 0).length}/{test.questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Total Skipped</span>
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
                // For dropdown questions, always use calculated result since DB validation is unreliable
                // For other question types, use stored result if available, otherwise calculate
                const isCorrect = question.type === 'dropdown' 
                  ? isAnswerCorrect(question, userAnswer)
                  : (userAnswer?.isCorrect !== undefined 
                      ? userAnswer.isCorrect 
                      : isAnswerCorrect(question, userAnswer));
                
                // Debug logging
                console.log(`Question ${index + 1}:`, {
                  questionId: question.id,
                  questionType: question.type,
                  userAnswer: userAnswer,
                  storedIsCorrect: userAnswer?.isCorrect,
                  calculatedIsCorrect: isAnswerCorrect(question, userAnswer),
                  finalIsCorrect: isCorrect
                });
                
                // Get correct answers for display based on question type
                const getCorrectAnswersText = () => {
                  if (question.type === 'dropdown') {
                    // For dropdown questions, show statement-answer pairs
                    const dropdownAnswers = question.dropdownItems?.map(item => 
                      `${item.statement}: ${item.correctAnswer}`
                    ).join('; ') || '';
                    return dropdownAnswers;
                  } else {
                    // For regular questions, show correct answer options
                    const correctAnswers = question.answers?.filter(a => a.isCorrect) || [];
                    return correctAnswers.map(a => a.text).join(', ');
                  }
                };
                
                const correctAnswerTexts = getCorrectAnswersText();
                
                return (
                  <div 
                    key={question.id}
                    className="border rounded-md p-4 space-y-3"
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-sm text-slate-500 font-medium">Q{index + 1}</span>
                        <div className="flex flex-col flex-1">
                          <span className="text-sm font-medium">{question.text}</span>
                          <span className="text-xs text-gray-500 mt-1">{question.category?.name || 'Uncategorized'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {!userAnswers.find(a => a.questionId === question.id) || 
                         !userAnswers.find(a => a.questionId === question.id)?.answers || 
                         userAnswers.find(a => a.questionId === question.id)?.answers.length === 0 ? (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Skipped</span>
                        ) : isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Correct Answer Section */}
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <h5 className="text-sm font-semibold text-green-800 mb-1">Correct Answer:</h5>
                      <p className="text-sm text-green-700">
                        {correctAnswerTexts || 'No correct answer available'}
                      </p>
                    </div>
                    
                    {/* Explanation Section */}
                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <h5 className="text-sm font-semibold text-blue-800 mb-1">Explanation:</h5>
                        <p className="text-sm text-blue-700 whitespace-pre-wrap">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                    
                    {/* User's Answer (if answered incorrectly) */}
                    {userAnswer && userAnswer.answers && userAnswer.answers.length > 0 && !isCorrect && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <h5 className="text-sm font-semibold text-red-800 mb-1">Your Answer:</h5>
                        <p className="text-sm text-red-700">
                          {(() => {
                            if (question.type === 'dropdown') {
                              // For dropdown questions, show statement-selection pairs
                              // userAnswer.answers contains the selected values for each dropdown
                              const dropdownSelections = question.dropdownItems?.map((item, index) => {
                                const selectedValue = userAnswer.answers[index] || 'Not selected';
                                return `${item.statement}: ${selectedValue}`;
                              }).join('; ') || '';
                              return dropdownSelections;
                            } else {
                              // For regular questions, show selected answer options
                              const userAnswerTexts = userAnswer.answers.map(answerId => {
                                const answer = question.answers?.find(a => a.id === answerId);
                                return answer?.text || answerId;
                              }).join(', ');
                              return userAnswerTexts;
                            }
                          })()}
                        </p>
                      </div>
                    )}
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
  
  // Debug logging
  console.log('isAnswerCorrect debug:', {
    questionType: question.type,
    correctAnswerIds,
    userAnswerIds: userAnswer.answers,
    correctAnswerTypes: correctAnswerIds.map(id => typeof id),
    userAnswerTypes: userAnswer.answers.map((id: any) => typeof id),
    questionAnswers: question.answers
  });
  
  // Convert all IDs to strings for comparison (handle potential type mismatches)
  const correctAnswerIdsStr = correctAnswerIds.map((id: any) => String(id));
  const userAnswerIdsStr = userAnswer.answers.map((id: any) => String(id));
  
  // Normalize question type (handle both underscore and hyphen)
  const normalizedType = question.type.replace(/_/g, '-');
  
  // Special handling for single-choice and true-false questions
  if (normalizedType === 'single-choice' || normalizedType === 'true-false') {
    // For single choice, just check if the selected answer is correct
    if (userAnswerIdsStr.length === 1 && correctAnswerIdsStr.length === 1) {
      const result = userAnswerIdsStr[0] === correctAnswerIdsStr[0];
      console.log('Single choice comparison:', {
        userAnswerId: userAnswerIdsStr[0],
        correctAnswerId: correctAnswerIdsStr[0],
        areEqual: result
      });
      return result;
    }
  }
  
  // For multiple-choice questions
  if (normalizedType === 'multiple-choice') {
    // If counts don't match, quick false
    if (correctAnswerIdsStr.length !== userAnswerIdsStr.length) return false;
    
    // Sort both arrays for comparison
    const sortedCorrect = [...correctAnswerIdsStr].sort();
    const sortedUser = [...userAnswerIdsStr].sort();
    
    // Check if arrays are equal
    return sortedCorrect.every((id, index) => id === sortedUser[index]);
  }
  
  // For dropdown questions
  if (normalizedType === 'dropdown') {
    console.log('🔍 DROPDOWN VALIDATION DEBUG:', {
      questionId: question.id,
      questionType: question.type,
      normalizedType: normalizedType,
      dropdownItems: question.dropdownItems,
      userAnswer: userAnswer,
      userAnswers: userAnswer.answers
    });
    
    // For dropdown questions, userAnswer.answers contains the selected values for each dropdown
    // We need to compare each selection with the correct answer for that dropdown item
    if (!question.dropdownItems || question.dropdownItems.length === 0) {
      console.log('❌ No dropdown items found');
      return false;
    }
    
    // Check if we have answers for all dropdown items
    if (userAnswer.answers.length !== question.dropdownItems.length) {
      console.log('❌ Answer count mismatch:', {
        expectedCount: question.dropdownItems.length,
        actualCount: userAnswer.answers.length
      });
      return false;
    }
    
    // Check each dropdown item
    for (let i = 0; i < question.dropdownItems.length; i++) {
      const dropdownItem = question.dropdownItems[i];
      const userSelection = userAnswer.answers[i];
      
      console.log(`🔍 Checking dropdown item ${i}:`, {
        statement: dropdownItem.statement,
        userSelected: userSelection,
        userSelectedType: typeof userSelection,
        correctAnswer: dropdownItem.correctAnswer,
        correctAnswerType: typeof dropdownItem.correctAnswer,
        userSelectedString: String(userSelection),
        correctAnswerString: String(dropdownItem.correctAnswer),
        areEqual: String(userSelection) === String(dropdownItem.correctAnswer)
      });
      
      // Compare the user's selection with the correct answer for this dropdown item
      if (String(userSelection) !== String(dropdownItem.correctAnswer)) {
        console.log(`❌ Dropdown item ${i} mismatch:`, {
          statement: dropdownItem.statement,
          userSelected: userSelection,
          correctAnswer: dropdownItem.correctAnswer,
          areEqual: String(userSelection) === String(dropdownItem.correctAnswer)
        });
        return false;
      }
    }
    
    console.log('✅ All dropdown items correct!');
    return true;
  }
  
  // For other question types, return false as we can't auto-determine correctness
  return false;
}