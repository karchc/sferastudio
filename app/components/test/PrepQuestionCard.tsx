import { Question } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { CheckCircle, Circle } from "lucide-react";

interface PrepQuestionCardProps {
  question: Question;
  onAnswerSelect: (answerData: any) => void;
  selectedAnswer: any;
  showFeedback?: boolean;
}

export default function PrepQuestionCard({
  question,
  onAnswerSelect,
  selectedAnswer,
  showFeedback = false
}: PrepQuestionCardProps) {
  // Use existing selected answers or default to empty array
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    selectedAnswer?.selectedIds || []
  );

  useEffect(() => {
    if (selectedAnswer?.selectedIds) {
      setSelectedAnswers(selectedAnswer.selectedIds);
    }
  }, [selectedAnswer]);

  // Normalize question type (handle both underscore and hyphen formats)
  const normalizeQuestionType = (type: string) => {
    return type.replace(/-/g, '_');
  };

  const toggleAnswer = (answerId: string) => {
    // If multiple answers are permitted (multiple-choice)
    if (normalizeQuestionType(question.type) === 'multiple_choice') {
      setSelectedAnswers(prev => {
        const newSelection = prev.includes(answerId)
          ? prev.filter(id => id !== answerId)
          : [...prev, answerId];
        
        // Update parent component with new answer
        onAnswerSelect({
          questionType: question.type,
          selectedIds: newSelection
        });
        
        return newSelection;
      });
    } else {
      // Single answer questions (single-choice, true-false)
      const newSelection = [answerId];
      setSelectedAnswers(newSelection);
      onAnswerSelect({
        questionType: question.type,
        selectedIds: newSelection
      });
    }
  };

  // Display different UI based on question type
  const renderQuestionContent = () => {
    // Ensure we have answers array
    if (!question.answers || !Array.isArray(question.answers) || question.answers.length === 0) {
      return (
        <div className="p-4 bg-yellow-50 rounded-md text-center">
          <p>No answer options available for this question.</p>
        </div>
      );
    }
    
    const normalizedType = normalizeQuestionType(question.type);
    
    switch (normalizedType) {
      case 'multiple_choice':
      case 'single_choice':
      case 'true_false':
        return (
          <div className="space-y-2">
            {(question.answers || []).map((answer) => (
              <div
                key={answer.id}
                onClick={() => toggleAnswer(answer.id)}
                className={cn(
                  "p-4 rounded-md border border-slate-200 cursor-pointer flex items-start gap-3 hover:bg-slate-50 transition-colors",
                  selectedAnswers.includes(answer.id) && "bg-blue-50 border-blue-200",
                  showFeedback && (answer as any).isCorrect && "bg-green-50 border-green-200",
                  showFeedback && selectedAnswers.includes(answer.id) && !(answer as any).isCorrect && "bg-red-50 border-red-200"
                )}
              >
                <div className="mt-0.5 text-blue-600">
                  {selectedAnswers.includes(answer.id) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <span className="whitespace-pre-line">{(answer as any).text}</span>
                {showFeedback && (answer as any).isCorrect && (
                  <span className="ml-auto text-green-600 text-sm">Correct</span>
                )}
              </div>
            ))}
          </div>
        );
        
      case 'matching':
        // Basic UI for matching questions
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">Match the items from the left column with the right column:</p>
            {(question.answers || []).map((item: any, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">{item.leftText || item.left_text}</div>
                <input
                  type="text"
                  placeholder="Enter matching text"
                  value={selectedAnswer?.matches?.[item.id] || ''}
                  onChange={(e) => {
                    const matches = {...(selectedAnswer?.matches || {})};
                    matches[item.id] = e.target.value;
                    onAnswerSelect({
                      questionType: 'matching',
                      matches
                    });
                  }}
                  className="p-2 border rounded-md"
                />
              </div>
            ))}
          </div>
        );
      
      case 'sequence':
        // Basic UI for sequence questions
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">Arrange these items in the correct order:</p>
            {(question.answers || []).map((item: any, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={question.answers?.length || 0}
                  value={selectedAnswer?.sequence?.[item.id] || ''}
                  onChange={(e) => {
                    const sequence = {...(selectedAnswer?.sequence || {})};
                    sequence[item.id] = parseInt(e.target.value);
                    onAnswerSelect({
                      questionType: 'sequence',
                      sequence
                    });
                  }}
                  className="w-16 p-2 border rounded-md"
                />
                <div className="flex-1 p-3 bg-gray-50 rounded-md">{item.text}</div>
              </div>
            ))}
          </div>
        );
      
      case 'drag-drop':
        // Basic UI for drag-drop questions
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-2">Drag these items to their correct categories:</p>
            {(question.answers || []).map((item: any, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-gray-50 rounded-md">{item.content || item.text}</div>
                <select
                  value={selectedAnswer?.placements?.[item.id] || ''}
                  onChange={(e) => {
                    const placements = {...(selectedAnswer?.placements || {})};
                    placements[item.id] = e.target.value;
                    onAnswerSelect({
                      questionType: 'drag-drop',
                      placements
                    });
                  }}
                  className="p-2 border rounded-md"
                >
                  <option value="">Select category</option>
                  {/* Get unique target zones */}
                  {Array.from(new Set((question.answers || []).map((a: any) => a.target_zone || a.targetZone))).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            ))}
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
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {question.type.replace(/[-_]/g, ' ')}
          </span>
        </div>
        <h2 className="text-xl font-medium">{question.text}</h2>
      </CardHeader>
      <CardContent>
        {renderQuestionContent()}
      </CardContent>
      {showFeedback && (
        <CardFooter>
          <div className="w-full p-3 bg-gray-50 rounded-md">
            <h3 className="font-medium">Explanation:</h3>
            <p className="text-sm text-gray-600 mt-1">
              {/* This would be populated with actual explanations in a real app */}
              This question tests your understanding of {question.type} concepts.
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}