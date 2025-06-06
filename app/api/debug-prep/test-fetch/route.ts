import { NextResponse } from 'next/server';
import { createDirectSupabase } from '@/app/lib/direct-supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');
  
  try {
    const supabase = createDirectSupabase();
    
    // Special case for listing all tests
    if (testId === 'list') {
      const { data: testsData, error: testsError } = await supabase
        .from('tests')
        .select('id, title')
        .order('created_at', { ascending: false });
        
      if (testsError) {
        return NextResponse.json(
          { error: 'Error fetching tests list', details: testsError },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        tests: testsData
      });
    }
    
    // If no testId provided or not 'list'
    if (!testId) {
      return NextResponse.json(
        { error: 'No testId provided' },
        { status: 400 }
      );
    }
    
    // Fetch test data
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('*, categories(*)')
      .eq('id', testId)
      .single();
      
    if (testError) {
      return NextResponse.json(
        { error: 'Error fetching test', details: testError },
        { status: 500 }
      );
    }
    
    // Fetch test questions
    const { data: testQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId)
      .order('position', { ascending: true });
      
    if (questionsError) {
      return NextResponse.json(
        { error: 'Error fetching questions', details: questionsError },
        { status: 500 }
      );
    }
    
    // Return structured response
    return NextResponse.json({
      success: true,
      test: testData,
      questions: testQuestions,
      total_questions: testQuestions.length
    });
  } catch (error) {
    console.error('Error in test-fetch API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error },
      { status: 500 }
    );
  }
}