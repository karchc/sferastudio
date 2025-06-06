import { NextResponse } from 'next/server';
import { createClientSupabase } from '@/app/supabase';

export async function GET() {
  try {
    const supabase = createClientSupabase();
    
    // Step 1: Fetch active test
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select(`
        *,
        categories(*)
      `)
      .eq('is_active', true)
      .limit(1)
      .single();
      
    if (testError || !testData) {
      return NextResponse.json({
        success: false,
        error: testError?.message || 'Failed to fetch test data',
        step: 'Fetch active test'
      }, { status: 500 });
    }

    // Step 2: Fetch test questions
    const { data: testQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*')  // Just get the basic data for now
      .eq('test_id', testData.id)
      .order('position', { ascending: true });

    if (questionsError || !testQuestions || testQuestions.length === 0) {
      return NextResponse.json({
        success: false,
        error: questionsError?.message || 'No questions found for this test',
        testData: testData,
        step: 'Fetch test questions'
      }, { status: 500 });
    }

    // Get question IDs 
    const questionIds = testQuestions.map(tq => tq.question_id);
    
    // Step 3: Fetch actual questions
    const { data: questions, error: fetchQuestionsError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);
      
    if (fetchQuestionsError || !questions) {
      return NextResponse.json({
        success: false,
        error: fetchQuestionsError?.message || 'Failed to fetch questions data',
        testData,
        testQuestions,
        step: 'Fetch question details'
      }, { status: 500 });
    }
    
    // Step 4: Fetch answers for the questions
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questionIds);
      
    if (answersError) {
      return NextResponse.json({
        success: false,
        error: answersError?.message || 'Failed to fetch answers',
        testData,
        testQuestions,
        questions,
        step: 'Fetch answers'
      }, { status: 500 });
    }
    
    // Group answers by question ID
    const answersByQuestionId: Record<string, any[]> = {};
    if (answers) {
      answers.forEach(answer => {
        if (!answersByQuestionId[answer.question_id]) {
          answersByQuestionId[answer.question_id] = [];
        }
        answersByQuestionId[answer.question_id].push(answer);
      });
    }
    
    // Combine questions with their answers
    const questionsWithAnswers = questions.map(question => ({
      ...question,
      answers: answersByQuestionId[question.id] || []
    }));
    
    // Match back with positions from test_questions
    const questionsWithPositions = questionsWithAnswers.map(q => {
      const tq = testQuestions.find(t => t.question_id === q.id);
      return {
        ...q,
        position: tq?.position || 0
      };
    }).sort((a, b) => a.position - b.position);
    
    // Construct the final response
    return NextResponse.json({
      success: true,
      testData: {
        id: testData.id,
        title: testData.title,
        description: testData.description,
        timeLimit: testData.time_limit,
        categoryId: testData.category_id,
        category: testData.categories,
        isActive: testData.is_active
      },
      questions: questionsWithPositions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        position: q.position,
        answerCount: q.answers.length
      })),
      detailedData: {
        testQuestionsCount: testQuestions.length,
        questionsCount: questions.length,
        answersCount: answers?.length || 0,
        questionsWithAnswers: questionsWithAnswers.length
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}