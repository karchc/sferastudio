import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a direct Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gezlcxtprkcceizadvre.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check for tests - specifically use the JavaScript Basics test ID
    const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    const { data: tests, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', testId);
      
    if (testsError) {
      return NextResponse.json({
        success: false,
        error: `Tests query failed: ${testsError.message}`,
        phase: 'tests_query'
      });
    }
    
    // If we have a test, check for questions
    let questions = null;
    let questionsError = null;
    
    // Now check for questions using the testId
    if (tests && tests.length > 0) {
      
      const questionsResult = await supabase
        .from('test_questions')
        .select('*, questions(*)')
        .eq('test_id', testId)
        .limit(1);
        
      questions = questionsResult.data;
      questionsError = questionsResult.error;
      
      if (questionsError) {
        return NextResponse.json({
          success: false,
          error: `Questions query failed: ${questionsError.message}`,
          phase: 'questions_query',
          testId,
          tests
        });
      }
    }
    
    // Check one more query
    let answers = null;
    let answersError = null;
    
    if (questions && questions.length > 0 && questions[0].questions) {
      const questionId = questions[0].questions.id;
      const questionType = questions[0].questions.type;
      
      let tableName;
      switch (questionType) {
        case 'multiple-choice':
        case 'single-choice':
        case 'true-false':
          tableName = 'answers';
          break;
        case 'matching':
          tableName = 'match_items';
          break;
        case 'sequence':
          tableName = 'sequence_items';
          break;
        case 'drag-drop':
          tableName = 'drag_drop_items';
          break;
        default:
          tableName = 'answers';
      }
      
      const answersResult = await supabase
        .from(tableName)
        .select('*')
        .eq('question_id', questionId)
        .limit(5);
        
      answers = answersResult.data;
      answersError = answersResult.error;
      
      if (answersError) {
        return NextResponse.json({
          success: false,
          error: `Answers query failed: ${answersError.message}`,
          phase: 'answers_query',
          tableName,
          questionId,
          tests,
          questions
        });
      }
    }
    
    // Success!
    return NextResponse.json({
      success: true,
      tests: tests,
      questions: questions,
      answers: answers,
      message: 'All diagnostics passed successfully'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Unexpected error: ${error.message}`,
      phase: 'unexpected_error',
      stack: error.stack
    });
  }
}