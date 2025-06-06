import { NextResponse } from 'next/server';
import { createClientSupabase } from '@/app/supabase';

export async function GET() {
  try {
    const supabase = createClientSupabase();
    
    // Create a mock test with hardcoded questions
    const mockTest = {
      id: 'mock-test-id',
      title: 'Mock JavaScript Test',
      description: 'A test with hardcoded questions for debugging purposes',
      timeLimit: 300, // 5 minutes
      categoryId: 'mock-category-id',
      category: {
        id: 'mock-category-id',
        name: 'JavaScript',
        description: 'JavaScript programming'
      },
      isActive: true,
      questions: [
        {
          id: 'q1',
          text: 'Which of the following is NOT a JavaScript data type?',
          type: 'multiple-choice',
          position: 1,
          answers: [
            { id: 'a1', text: 'String', is_correct: false },
            { id: 'a2', text: 'Number', is_correct: false },
            { id: 'a3', text: 'Boolean', is_correct: false },
            { id: 'a4', text: 'Character', is_correct: true }
          ]
        },
        {
          id: 'q2',
          text: 'What does the "use strict" directive do in JavaScript?',
          type: 'single-choice',
          position: 2,
          answers: [
            { id: 'a5', text: 'Enforces stricter parsing and error handling', is_correct: true },
            { id: 'a6', text: 'Makes the code run faster', is_correct: false },
            { id: 'a7', text: 'Enables newer JavaScript features', is_correct: false },
            { id: 'a8', text: 'Has no effect in modern browsers', is_correct: false }
          ]
        },
        {
          id: 'q3',
          text: 'JavaScript is a statically typed language.',
          type: 'true-false',
          position: 3,
          answers: [
            { id: 'a9', text: 'True', is_correct: false },
            { id: 'a10', text: 'False', is_correct: true }
          ]
        },
        {
          id: 'q4',
          text: 'Match the JavaScript method with its purpose:',
          type: 'matching',
          position: 4,
          answers: [
            { id: 'a11', left_text: 'push()', right_text: 'Add elements to the end of an array' },
            { id: 'a12', left_text: 'pop()', right_text: 'Remove the last element from an array' },
            { id: 'a13', left_text: 'shift()', right_text: 'Remove the first element from an array' },
            { id: 'a14', left_text: 'unshift()', right_text: 'Add elements to the beginning of an array' }
          ]
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      mockTest: mockTest
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}