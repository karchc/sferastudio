"use client";

import { UserAnswer } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";
import { Flag } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  userAnswers: UserAnswer[];
  flaggedQuestions: Set<string>;
  questionIds: string[];
  onNavigate: (index: number) => void;
  allowBackwardNavigation?: boolean;
}

export function QuestionNavigation({ 
  currentIndex, 
  totalQuestions, 
  userAnswers, 
  flaggedQuestions,
  questionIds,
  onNavigate,
  allowBackwardNavigation = true
}: QuestionNavigationProps) {
  // Create an array of question indexes
  const indexes = Array.from({ length: totalQuestions }, (_, i) => i);
  
  // Check if a question has been answered
  const isAnswered = (questionId: string) => {
    const answer = userAnswers.find(a => a.questionId === questionId);
    return answer && answer.answers && answer.answers.length > 0;
  };

  return (
    <Card className="w-full mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Question Navigation</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <Flag className="w-3 h-3 text-orange-500" />
              <span>Flagged</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {indexes.map(index => {
            const questionId = questionIds[index];
            const answered = isAnswered(questionId);
            const isFlagged = flaggedQuestions.has(questionId);
            
            return (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                disabled={!allowBackwardNavigation && index < currentIndex}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm border relative",
                  currentIndex === index 
                    ? "bg-blue-500 text-white border-blue-500" 
                    : answered
                      ? "bg-green-100 text-green-800 border-green-500"
                      : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200",
                  !allowBackwardNavigation && index < currentIndex && "opacity-50 cursor-not-allowed hover:bg-gray-100"
                )}
              >
                <span>{index + 1}</span>
                {isFlagged && (
                  <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 fill-orange-500" />
                )}
              </button>
            );
          })}
        </div>
        
        {userAnswers.length > 0 && (
          <div className="mt-4 text-xs text-right text-slate-500">
            {userAnswers.filter(a => a.answers && a.answers.length > 0).length} of {totalQuestions} questions answered
          </div>
        )}
      </CardContent>
    </Card>
  );
}