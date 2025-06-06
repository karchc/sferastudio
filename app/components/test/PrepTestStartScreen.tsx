import React from 'react';
import { TestData } from '@/app/lib/types';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface PrepTestStartScreenProps {
  test: TestData;
  onStart: () => void;
}

export default function PrepTestStartScreen({ test, onStart }: PrepTestStartScreenProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{test.title}</CardTitle>
          <CardDescription>
            {test.categories?.[0]?.name && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                {test.categories[0].name}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {test.questions.length} questions • {formatTime(test.timeLimit)}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {test.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600">{test.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-medium mb-2">Preparation Exam Information</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>This exam contains {test.questions.length} questions of various types</li>
              <li>You will have {formatTime(test.timeLimit)} to complete the exam</li>
              <li>You can navigate between questions using the Previous and Next buttons</li>
              <li>Your answers are saved as you progress through the exam</li>
              <li>You will see your results immediately after completing the exam</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> This is a practice exam. Results will not be permanently stored.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onStart} className="w-full">
            Start Exam
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}