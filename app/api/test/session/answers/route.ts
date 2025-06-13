import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/auth-server';

// Save user answers for a test session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, answers, totalQuestions } = body;

    if (!sessionId || !answers) {
      return NextResponse.json({ error: 'Session ID and answers are required' }, { status: 400 });
    }

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found or unauthorized' }, { status: 404 });
    }

    // Delete existing answers for this session (in case of retry within same session)
    await supabase
      .from('user_answers')
      .delete()
      .eq('test_session_id', sessionId);

    console.log('API received answers data:', {
      sessionId,
      answersCount: answers.length,
      sampleAnswers: answers.slice(0, 3)
    });

    // Prepare user answers for insertion
    const userAnswers = answers.map((answer: any) => ({
      test_session_id: sessionId,
      question_id: answer.questionId,
      time_spent: answer.timeSpent || 0,
      is_correct: answer.isCorrect || false
    }));

    console.log('Prepared user answers for database:', {
      count: userAnswers.length,
      sample: userAnswers.slice(0, 3)
    });

    // Insert user answers
    const { error: answersError } = await supabase
      .from('user_answers')
      .insert(userAnswers);

    if (answersError) {
      console.error('Error saving user answers:', answersError);
      return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 });
    }

    // For multiple choice questions, save selected answer choices
    const selectedAnswers = [];
    for (const answer of answers) {
      if (answer.answers && answer.answers.length > 0) {
        const { data: userAnswer } = await supabase
          .from('user_answers')
          .select('id')
          .eq('test_session_id', sessionId)
          .eq('question_id', answer.questionId)
          .single();

        if (userAnswer) {
          for (const answerId of answer.answers) {
            selectedAnswers.push({
              user_answer_id: userAnswer.id,
              answer_id: answerId
            });
          }
        }
      }
    }

    if (selectedAnswers.length > 0) {
      const { error: selectedError } = await supabase
        .from('selected_answers')
        .insert(selectedAnswers);

      if (selectedError) {
        console.error('Error saving selected answers:', selectedError);
      }
    }

    // Calculate score based on correct answers vs total questions in test
    const correctCount = answers.filter((a: any) => a.isCorrect).length;
    const answeredCount = answers.filter((a: any) => a.answers && a.answers.length > 0).length;
    const actualTotalQuestions = totalQuestions || answers.length;
    const score = actualTotalQuestions > 0 ? Math.round((correctCount / actualTotalQuestions) * 100) : 0;
    const skippedCount = actualTotalQuestions - answeredCount;

    console.log('Score calculation:', {
      correctCount,
      answeredCount,
      actualTotalQuestions,
      score,
      skippedCount
    });

    // Update session with score (don't override if score is already set by frontend)
    const sessionUpdate: any = {};
    if (score !== undefined) {
      sessionUpdate.score = score;
    }
    
    if (Object.keys(sessionUpdate).length > 0) {
      await supabase
        .from('test_sessions')
        .update(sessionUpdate)
        .eq('id', sessionId);
    }

    return NextResponse.json({ 
      success: true,
      score,
      correctCount,
      totalQuestions: actualTotalQuestions,
      answeredCount,
      skippedCount
    });
  } catch (error) {
    console.error('Error saving answers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}