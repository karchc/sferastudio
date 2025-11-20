import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/auth-server';

// Get active test session for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get testId from query params if provided
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    let query = supabase
      .from('test_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('start_time', { ascending: false });

    if (testId) {
      query = query.eq('test_id', testId);
    }

    const { data: sessions, error } = await query.limit(1);

    if (error) {
      console.error('Error fetching active session:', error);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    const session = sessions && sessions.length > 0 ? sessions[0] : null;

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in session fetch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new test session
export async function POST(request: NextRequest) {
  try {
    console.log('Creating new test session...');
    const supabase = await createServerSupabase();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Unauthorized user trying to create session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    const body = await request.json();
    const { testId } = body;

    console.log('Session creation request:', { testId, userId: user.id });

    if (!testId) {
      console.error('No test ID provided');
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // Check if there's already an active session for this test
    const { data: existingSessions } = await supabase
      .from('test_sessions')
      .select('id, test_id, start_time, status')
      .eq('user_id', user.id)
      .eq('test_id', testId)
      .eq('status', 'in_progress')
      .limit(1);

    if (existingSessions && existingSessions.length > 0) {
      console.log('Active session already exists:', existingSessions[0].id);
      return NextResponse.json({
        session: existingSessions[0],
        resumed: true
      });
    }

    // Create a new test session
    const { data: session, error } = await supabase
      .from('test_sessions')
      .insert({
        test_id: testId,
        user_id: user.id,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        score: 0,
        time_spent: 0,
        current_question_index: 0,
        session_data: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test session:', error);
      console.error('Failed session data:', {
        test_id: testId,
        user_id: user.id,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        score: 0,
        time_spent: 0
      });
      return NextResponse.json({ error: 'Failed to create test session', details: error }, { status: 500 });
    }

    console.log('Successfully created session:', session.id);
    return NextResponse.json({ session, resumed: false });
  } catch (error) {
    console.error('Error in session creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update an existing test session
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, status, score, timeSpent, endTime, currentQuestionIndex, sessionData } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update test session
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (score !== undefined) updateData.score = score;
    if (timeSpent !== undefined) updateData.time_spent = timeSpent;
    if (endTime) updateData.end_time = endTime;
    if (currentQuestionIndex !== undefined) updateData.current_question_index = currentQuestionIndex;
    if (sessionData !== undefined) updateData.session_data = sessionData;

    const { data: session, error } = await supabase
      .from('test_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only update their own sessions
      .select()
      .single();

    if (error) {
      console.error('Error updating test session:', error);
      return NextResponse.json({ error: 'Failed to update test session' }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in session update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}