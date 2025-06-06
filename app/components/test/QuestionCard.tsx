import { Question, UserAnswer } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
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
  totalQuestions
}: QuestionCardProps) {
  // Use existing selected answers or default to empty array
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    currentAnswer?.answers || []
  );

  const toggleAnswer = (answerId: string) => {
    // If multiple answers are permitted
    if (question.type === 'multiple-choice') {
      setSelectedAnswers(prev => {
        const newSelection = prev.includes(answerId)
          ? prev.filter(id => id !== answerId)
          : [...prev, answerId];
        
        // Update parent component with new answer
        onAnswer(newSelection);
        return newSelection;
      });
    } else {
      // Single answer questions
      const newSelection = [answerId];
      setSelectedAnswers(newSelection);
      onAnswer(newSelection);
    }
  };

  // Display different UI based on question type
  const renderQuestionContent = () => {

    switch (question.type) {
      case 'multiple-choice':
      case 'single-choice':
      case 'true-false':
        return (
          <div className="space-y-2">
            {(question.answers || []).map((answer: any) => (
              <motion.div
                key={answer.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleAnswer(answer.id)}
                className={cn(
                  "p-4 rounded-md border border-slate-200 cursor-pointer flex items-start gap-3 hover:bg-slate-50 transition-colors",
                  selectedAnswers.includes(answer.id) && "bg-blue-50 border-blue-200"
                )}
              >
                <div className="mt-0.5 text-blue-600">
                  {selectedAnswers.includes(answer.id) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <span className="whitespace-pre-line">{answer.text}</span>
              </motion.div>
            ))}
          </div>
        );
        
      case 'matching':
      case 'sequence':
      case 'drag-drop':
        // For demo purposes, show a message about these question types
        return (
          <div className="p-6 text-center">
            <p className="text-lg text-gray-600 mb-2">
              {question.type.replace('-', ' ')} question type
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
        return <p>Unknown question type</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4"
    >
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-500">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {question.type.replace('-', ' ')}
            </span>
          </div>
          <h2 className="text-xl font-medium">{question.text}</h2>
          {question.type === 'multiple-choice' && question.answers && (
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
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirst}
          >
            Previous
          </Button>
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
              disabled={selectedAnswers.length === 0 && !isFlagged}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}