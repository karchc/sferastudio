'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { Question, MatchItem, SequenceItem, DragDropItem } from '@/app/lib/types';

interface QuestionCardProps {
  question: Question;
  onChange: (answerData: any) => void;
  userAnswer?: any;
}

// Memoize the entire component to prevent re-renders when parent components update
const OptimizedQuestionCard = memo(function QuestionCard({ 
  question, 
  onChange, 
  userAnswer 
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState<any>(userAnswer || null);

  // Update local state when props change
  useEffect(() => {
    setLocalAnswer(userAnswer || null);
  }, [userAnswer]);

  // Handle answer selection with debouncing to reduce state updates
  const handleAnswerChange = (newAnswerData: any) => {
    setLocalAnswer(newAnswerData);
    
    // Debounce changes to avoid excessive state updates in parent component
    if (onChange) {
      onChange(newAnswerData);
    }
  };

  // Pre-process question data outside of render cycle for better performance
  const processedQuestion = useMemo(() => {
    // Transform question data into optimal rendering format
    return {
      id: question.id,
      text: question.text,
      type: question.type,
      // Process answers based on question type
      answers: (question.type === 'multiple-choice' || question.type === 'single-choice') && question.answers ? 
        // Sort answers for consistent rendering (avoiding unnecessary re-renders)
        [...question.answers].sort((a: any, b: any) => a.id.localeCompare(b.id)) : 
        [],
      matchItems: question.type === 'matching' && question.answers ?
        [...(question.answers as MatchItem[])].sort((a, b) => a.id.localeCompare(b.id)) :
        [],
      sequenceItems: question.type === 'sequence' && question.answers ?
        [...(question.answers as SequenceItem[])].sort((a, b) => (a.correctPosition || 0) - (b.correctPosition || 0)) :
        [],
      dragDropItems: question.type === 'drag-drop' && question.answers ?
        [...(question.answers as DragDropItem[])].sort((a, b) => a.id.localeCompare(b.id)) :
        []
    };
  }, [question]);

  // Render different question types
  const renderQuestionContent = () => {
    switch (processedQuestion.type) {
      case 'single-choice':
        return renderSingleChoice();
      case 'multiple-choice':
        return renderMultipleChoice();
      case 'true-false':
        return renderTrueFalse();
      case 'matching':
        return renderMatching();
      case 'sequence':
        return renderSequence();
      case 'drag-drop':
        return renderDragDrop();
      default:
        return <p className="text-red-500">Unknown question type: {processedQuestion.type}</p>;
    }
  };

  // Single choice question type
  const renderSingleChoice = () => {
    const selectedId = localAnswer?.selectedId || '';
    
    return (
      <div className="space-y-3">
        {processedQuestion.answers.map((answer: any) => (
          <div 
            key={answer.id}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selectedId === answer.id ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-100 border-gray-300'
            }`}
            onClick={() => handleAnswerChange({ selectedId: answer.id })}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 mr-3 rounded-full border flex items-center justify-center ${
                selectedId === answer.id ? 'border-blue-500' : 'border-gray-400'
              }`}>
                {selectedId === answer.id && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div>{answer.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Multiple choice question type
  const renderMultipleChoice = () => {
    const selectedIds = localAnswer?.selectedIds || [];
    
    return (
      <div className="space-y-3">
        {processedQuestion.answers.map((answer: any) => {
          const isSelected = selectedIds.includes(answer.id);
          
          return (
            <div 
              key={answer.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-100 border-gray-300'
              }`}
              onClick={() => {
                const newSelectedIds = isSelected
                  ? selectedIds.filter((id: string) => id !== answer.id)
                  : [...selectedIds, answer.id];
                  
                handleAnswerChange({ selectedIds: newSelectedIds });
              }}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 mr-3 border flex items-center justify-center ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>{answer.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // True/False question type
  const renderTrueFalse = () => {
    const selected = localAnswer?.value;
    
    return (
      <div className="space-y-3">
        {['True', 'False'].map((value) => (
          <div 
            key={value}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              selected === value ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-100 border-gray-300'
            }`}
            onClick={() => handleAnswerChange({ value })}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 mr-3 rounded-full border flex items-center justify-center ${
                selected === value ? 'border-blue-500' : 'border-gray-400'
              }`}>
                {selected === value && (
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                )}
              </div>
              <div>{value}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Matching question type
  const renderMatching = () => {
    const matches = localAnswer?.matches || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column items */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-2">Items</h3>
            {processedQuestion.matchItems.map((item: any) => (
              <div key={item.id} className="p-3 bg-blue-50 border border-blue-200 rounded">
                {item.left_text}
              </div>
            ))}
          </div>
          
          {/* Right column items (to be matched) */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 mb-2">Matching Items</h3>
            {/* This is a simplified version. A real implementation would allow reordering */}
            {processedQuestion.matchItems.map((item: any) => (
              <div key={`right-${item.id}`} className="p-3 bg-green-50 border border-green-200 rounded">
                {item.right_text}
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium text-yellow-700">Matching interaction not fully implemented</p>
          <p className="text-yellow-600 mt-1">
            In a complete implementation, users would be able to drag and drop or select matches 
            between the left and right columns.
          </p>
        </div>
      </div>
    );
  };

  // Sequence question type
  const renderSequence = () => {
    const sequence = localAnswer?.sequence || 
      processedQuestion.sequenceItems.map((item: any, index: number) => ({ 
        id: item.id, 
        position: index + 1 
      }));
    
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {/* This is a simplified version. A real implementation would allow reordering */}
          {processedQuestion.sequenceItems.map((item: any) => (
            <div 
              key={item.id}
              className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center"
            >
              <span className="inline-block w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">
                {sequence.find((s: any) => s.id === item.id)?.position || '?'}
              </span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium text-yellow-700">Sequence interaction not fully implemented</p>
          <p className="text-yellow-600 mt-1">
            In a complete implementation, users would be able to reorder items by dragging and dropping.
          </p>
        </div>
      </div>
    );
  };

  // Drag and drop question type
  const renderDragDrop = () => {
    const placements = localAnswer?.placements || {};
    
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 mb-2">Items to place</h3>
          {/* This is a simplified version. A real implementation would allow dragging */}
          {processedQuestion.dragDropItems.map((item: any) => (
            <div 
              key={item.id}
              className="p-3 bg-blue-50 border border-blue-200 rounded"
            >
              {item.content}
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700 mb-2">Drop Zones</h3>
          {/* Get unique target zones */}
          {Array.from(new Set(processedQuestion.dragDropItems.map((item: any) => item.target_zone))).map((zone) => (
            <div key={`zone-${zone}`} className="p-4 border border-dashed border-gray-400 rounded-lg">
              <div className="font-medium mb-2">{zone}</div>
              <div className="min-h-12 bg-gray-50 rounded p-2">
                <span className="text-gray-500 text-sm">Items will appear here when dropped</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium text-yellow-700">Drag and drop interaction not fully implemented</p>
          <p className="text-yellow-600 mt-1">
            In a complete implementation, users would be able to drag items to the appropriate zones.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="mb-6">
        <div className="text-lg font-bold mb-1">Question {question.position || ''}:</div>
        <div className="text-lg">{processedQuestion.text}</div>
        {question.mediaUrl && (
          <div className="mt-4">
            <img 
              src={question.mediaUrl} 
              alt="Question illustration" 
              className="max-w-full h-auto rounded-md shadow-sm"
            />
          </div>
        )}
      </div>
      
      {renderQuestionContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  // Only re-render if the question ID changes or the user answer for this question changes
  const questionsEqual = prevProps.question.id === nextProps.question.id;
  
  // Deep compare user answers - this is a simplified version
  const answersEqual = JSON.stringify(prevProps.userAnswer) === JSON.stringify(nextProps.userAnswer);
  
  return questionsEqual && answersEqual;
});

export default OptimizedQuestionCard;