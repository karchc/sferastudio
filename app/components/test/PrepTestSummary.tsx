import React, { useMemo } from 'react';
import { TestData } from '@/app/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import PrepQuestionCard from './PrepQuestionCard';

interface PrepTestSummaryProps {
  test: TestData;
  answers: Record<string, any>;
  timeSpent: number;
}

export default function PrepTestSummary({ test, answers, timeSpent }: PrepTestSummaryProps) {
  const router = useRouter();
  
  // Calculate results
  const results = useMemo(() => {
    let totalQuestions = test.questions.length;
    let answered = 0;
    let correct = 0;
    
    test.questions.forEach(question => {
      const answer = answers[question.id];
      
      if (answer) {
        answered++;
        
        // Check if answer is correct based on question type
        if (question.type === 'multiple-choice' || question.type === 'single-choice' || question.type === 'true-false') {
          // Get selected answer IDs
          const selectedIds = answer.selectedIds || [];
          
          // Get correct answer IDs
          const correctIds = (question.answers || [])
            .filter((a: any) => a.isCorrect || a.is_correct)
            .map((a: any) => a.id);
          
          // For correct answer:
          // 1. Same number of selections
          // 2. All selected answers must be correct
          if (
            selectedIds.length === correctIds.length &&
            selectedIds.every((id: any) => correctIds.includes(id))
          ) {
            correct++;
          }
        }
        // For other question types, we'd need more complex checking
        // This is simplified for the demo
      }
    });
    
    return {
      totalQuestions,
      answered,
      correct,
      percentageCorrect: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
      timeSpent,
      formattedTime: formatTime(timeSpent)
    };
  }, [test, answers, timeSpent]);
  
  // Format time function
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>{test.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Score</div>
                <div className="text-3xl font-bold">{results.percentageCorrect}%</div>
                <div className="text-sm text-blue-600">{results.correct} of {results.totalQuestions} correct</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Completion</div>
                <div className="text-3xl font-bold">{Math.round((results.answered / results.totalQuestions) * 100)}%</div>
                <div className="text-sm text-green-600">{results.answered} of {results.totalQuestions} answered</div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Time Spent</div>
                <div className="text-3xl font-bold">{results.formattedTime}</div>
                <div className="text-sm text-purple-600">
                  {Math.round(results.timeSpent / results.totalQuestions)} seconds per question
                </div>
              </div>
            </div>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Performance
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {results.percentageCorrect}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div style={{ width: `${results.percentageCorrect}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardFooter>
        </Card>
        
        <h2 className="text-xl font-bold mb-4">Question Review</h2>
        
        <div className="space-y-8">
          {test.questions.map((question, index) => (
            <div key={question.id} className="border-b pb-8 last:border-0">
              <div className="mb-2 font-medium text-gray-500">Question {index + 1}</div>
              <PrepQuestionCard
                question={question}
                onAnswerSelect={() => {}}
                selectedAnswer={answers[question.id]}
                showFeedback={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}