import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface PrepTestContainerProps {
  title: string;
  questionCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  children: React.ReactNode;
  allowBackwardNavigation?: boolean;
}

export default function PrepTestContainer({
  title,
  questionCount,
  currentIndex,
  onNext,
  onPrev,
  onComplete,
  children,
  allowBackwardNavigation = true
}: PrepTestContainerProps) {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Question {currentIndex + 1} of {questionCount}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((currentIndex + 1) / questionCount) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 mb-8">
        {children}
      </div>

      <div className="flex justify-between mt-6">
        {allowBackwardNavigation ? (
          <Button 
            variant="outline" 
            onClick={onPrev}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
        ) : (
          <div></div>
        )}
        
        <div className="flex gap-2">
          {currentIndex < questionCount - 1 ? (
            <Button 
              variant="default"
              onClick={onNext}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="default" 
              onClick={onComplete}
            >
              Complete Exam
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}