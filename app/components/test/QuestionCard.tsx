'use client';

import { Question, UserAnswer } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { CheckCircle, Circle, Flag } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  currentAnswer: UserAnswer | undefined;
  onAnswer: (answerId: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFlagToggle: (questionId: string) => void;
  isFlagged: boolean;
  isFirst: boolean;
  isLast: boolean;
  currentIndex: number;
  totalQuestions: number;
  allowBackwardNavigation?: boolean;
}

export function QuestionCard({
  question,
  currentAnswer,
  onAnswer,
  onNext,
  onPrevious,
  onFlagToggle,
  isFlagged,
  isFirst,
  isLast,
  currentIndex,
  totalQuestions,
  allowBackwardNavigation = true
}: QuestionCardProps) {
  // Use existing selected answers or default to empty array
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    currentAnswer?.answers || []
  );
  
  const isInitialMount = useRef(true);

  // Call onAnswer when selectedAnswers changes (but not on initial load)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onAnswer(selectedAnswers);
  }, [selectedAnswers, onAnswer]);

  const toggleAnswer = (answerId: string) => {
    // If multiple answers are permitted
    if (normalizeQuestionType(question.type) === 'multiple_choice') {
      setSelectedAnswers(prev => {
        const isAlreadySelected = prev.includes(answerId);
        const correctAnswersCount = question.answers?.filter((a: any) => a.isCorrect).length || 0;
        
        if (isAlreadySelected) {
          // Always allow unselecting
          const newSelection = prev.filter(id => id !== answerId);
          return newSelection;
        } else {
          // Only allow selecting if we haven't reached the limit
          if (prev.length < correctAnswersCount) {
            const newSelection = [...prev, answerId];
            return newSelection;
          }
          // Don't change selection if limit reached
          return prev;
        }
      });
    } else {
      // Single answer questions
      const newSelection = [answerId];
      setSelectedAnswers(newSelection);
    }
  };

  // Normalize question type (handle both underscore and hyphen formats)
  const normalizeQuestionType = (type: string) => {
    return type.replace(/-/g, '_');
  };

  // Display different UI based on question type
  const renderQuestionContent = () => {
    const normalizedType = normalizeQuestionType(question.type);
    
    switch (normalizedType) {
      case 'multiple_choice':
      case 'single_choice':
      case 'true_false':
        return (
          <div className="space-y-2">
            {(question.answers || []).map((answer: any) => {
              const isSelected = selectedAnswers.includes(answer.id);
              const correctAnswersCount = question.answers?.filter((a: any) => a.isCorrect).length || 0;
              const isDisabled = normalizeQuestionType(question.type) === 'multiple_choice' && 
                                !isSelected && 
                                selectedAnswers.length >= correctAnswersCount;
              
              return (
                <div
                  key={answer.id}
                  onClick={() => !isDisabled && toggleAnswer(answer.id)}
                  className={cn(
                    "p-4 rounded-md border border-slate-200 flex items-start gap-3 transition-colors",
                    isDisabled 
                      ? "cursor-not-allowed opacity-50 bg-gray-50 border-gray-200" 
                      : "cursor-pointer hover:bg-slate-50",
                    isSelected && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className={cn("mt-0.5", isSelected ? "text-blue-600" : isDisabled ? "text-gray-400" : "text-blue-600")}>
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn("whitespace-pre-line", isDisabled && "text-gray-500")}>{answer.text}</span>
                </div>
              );
            })}
          </div>
        );
        
      case 'dropdown':
        return (
          <div className="space-y-4">
            {(question.dropdownItems || [])
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((dropdownItem: any, index) => (
                <div key={dropdownItem.id || index} className="flex items-center gap-4 p-4 border border-slate-200 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{dropdownItem.statement}</p>
                  </div>
                  <div className="flex-shrink-0 min-w-48">
                    <select 
                      className="w-full p-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      onChange={(e) => {
                        const newAnswers = [...selectedAnswers];
                        newAnswers[index] = e.target.value;
                        setSelectedAnswers(newAnswers);
                      }}
                      value={selectedAnswers[index] || ""}
                    >
                      <option value="">Select an option...</option>
                      {(dropdownItem.options || []).map((option: string, optionIndex: number) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
          </div>
        );
        
      case 'matching':
      case 'sequence':
      case 'drag_drop':
        // For demo purposes, show a message about these question types
        return (
          <div className="p-6 text-center">
            <p className="text-lg text-gray-600 mb-2">
              {question.type.replace('_', ' ')} question type
            </p>
            <p className="text-gray-500">
              This question type requires interactive UI components, which would be implemented in the full version.
            </p>
            <div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
              <p className="font-semibold mb-2">Sample answers/items (read-only for demo):</p>
              <ul className="list-disc pl-5 space-y-1">
                {(question.answers || []).map((item: any, idx) => (
                  <li key={idx}>
                    {item.text || item.content || 
                    (item.leftText && `${item.leftText} ↔ ${item.rightText}`) || 
                    (item.correctPosition && `${item.correctPosition}. ${item.text}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-6 text-center">
            <p className="text-lg text-red-600 mb-2">
              Unknown question type: "{question.type}"
            </p>
            <p className="text-gray-500 mb-4">
              This question type is not yet supported. Please contact support.
            </p>
            <div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
              <p className="font-semibold mb-2">Question details for debugging:</p>
              <pre className="text-sm text-gray-700 bg-gray-200 p-2 rounded">
                {JSON.stringify({ type: question.type, id: question.id }, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-500">
              Question {currentIndex + 1} of {totalQuestions}
              {question.category?.name && (
                <span className="text-blue-600 font-medium"> - {question.category.name}</span>
              )}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {question.type.replace(/[-_]/g, ' ')}
            </span>
          </div>
          <h2 className="text-xl font-medium">{question.text}</h2>
          {normalizeQuestionType(question.type) === 'multiple_choice' && question.answers && (
            <span className="text-sm text-slate-500 mt-2 block">
              Select {question.answers.filter((a: any) => a.isCorrect).length} correct answer{question.answers.filter((a: any) => a.isCorrect).length !== 1 ? 's' : ''}
            </span>
          )}
          {question.mediaUrl && (
            <div className="mt-4">
              <img 
                src={question.mediaUrl} 
                alt="Question illustration" 
                className="max-w-full h-auto rounded-md shadow-sm"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {renderQuestionContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          {allowBackwardNavigation ? (
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirst}
            >
              Previous
            </Button>
          ) : (
            <div></div>
          )}
          <div className="flex space-x-2">
            <Button
              variant={isFlagged ? "default" : "outline"}
              onClick={() => onFlagToggle(question.id)}
              className={cn(isFlagged && "bg-orange-500 hover:bg-orange-600")}
            >
              <Flag className={cn("h-4 w-4", !isFlagged && "text-gray-500")} />
              {isFlagged ? "Flagged" : "Flag"}
            </Button>
            <Button
              onClick={onNext}
              disabled={(() => {
                if (isFlagged) return false;
                const normalizedType = normalizeQuestionType(question.type);
                if (normalizedType === 'dropdown') {
                  const dropdownCount = question.dropdownItems?.length || 0;
                  return selectedAnswers.filter(answer => answer && answer.trim()).length < dropdownCount;
                }
                return selectedAnswers.length === 0;
              })()}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}