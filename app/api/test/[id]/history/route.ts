import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/auth-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.id;

    // Fetch test details
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id, title, description, time_limit')
      .eq('id', testId)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Fetch all test sessions for this user and test
    const { data: sessions, error: sessionsError } = await supabase
      .from('test_sessions')
      .select(`
        id,
        start_time,
        end_time,
        status,
        score,
        time_spent,
        created_at,
        user_answers (
          id,
          question_id,
          is_correct,
          time_spent
        )
      `)
      .eq('test_id', testId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching test sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch test history' }, { status: 500 });
    }

    // Get total questions count for the test
    const { count: totalQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId);

    // Calculate statistics for each session
    const sessionsWithStats = sessions?.map(session => {
      // user_answers contains only questions that were attempted (answered or explicitly marked as incorrect)
      const allAnswers = session.user_answers || [];
      const correctAnswers = allAnswers.filter((a: any) => a.is_correct).length;
      const totalAnswered = allAnswers.length; // Total questions attempted
      const skippedQuestions = (totalQuestions || 0) - totalAnswered;
      
      // Use the score from database if available, otherwise calculate it
      const dbScore = session.score || 0;
      const calculatedPercentage = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const percentage = dbScore > 0 ? dbScore : calculatedPercentage;
      
      const avgTimePerQuestion = totalAnswered > 0 
        ? Math.round((session.time_spent || 0) / totalAnswered)
        : 0;

      console.log(`Session ${session.id}:`, {
        userAnswersCount: allAnswers.length,
        correctAnswers,
        totalQuestions,
        totalAnswered,
        skippedQuestions,
        dbScore,
        calculatedPercentage,
        finalPercentage: percentage,
        rawUserAnswers: allAnswers
      });

      return {
        ...session,
        totalQuestions,
        totalAnswered,
        correctAnswers,
        percentage,
        avgTimePercentage: percentage,
        skippedQuestions
      };
    });

    // Calculate overall statistics
    const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
    const overallStats = {
      totalAttempts: sessions?.length || 0,
      completedAttempts: completedSessions.length,
      averageScore: completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length)
        : 0,
      bestScore: completedSessions.length > 0
        ? Math.max(...completedSessions.map(s => s.score || 0))
        : 0,
      averageTime: completedSessions.length > 0
        ? Math.round(completedSessions.reduce((sum, s) => sum + (s.time_spent || 0), 0) / completedSessions.length)
        : 0
    };

    return NextResponse.json({
      test,
      sessions: sessionsWithStats,
      overallStats
    });

  } catch (error) {
    console.error('Error in test history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}