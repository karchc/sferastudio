import { NextResponse } from 'next/server';
import { fetchTestDataOptimized } from '@/app/lib/optimized-test-fetcher';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testId = url.searchParams.get('testId') || 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  
  console.log(`Diagnosing test fetch for test ID: ${testId}`);
  
  try {
    const startTime = performance.now();
    const result = await fetchTestDataOptimized(testId);
    const duration = performance.now() - startTime;
    
    // Add timing information
    result.diagnostics.totalDurationMs = duration;
    
    return NextResponse.json({
      testId,
      success: result.success,
      diagnostics: result.diagnostics,
      error: result.error,
      questionCount: result.testData?.questions?.length || 0,
      testData: result.testData ? {
        id: result.testData.id,
        title: result.testData.title,
        questionCount: result.testData.questions?.length || 0,
        timeLimit: result.testData.timeLimit,
        hasQuestions: !!result.testData.questions && result.testData.questions.length > 0,
        hasAnswers: result.testData.questions?.some(q => q.answers && q.answers.length > 0) || false,
        questionsWithNoAnswers: result.testData.questions?.filter(q => !q.answers || q.answers.length === 0).length || 0,
      } : null
    });
  } catch (error) {
    console.error('Error in test fetch diagnostic endpoint:', error);
    return NextResponse.json({
      testId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}