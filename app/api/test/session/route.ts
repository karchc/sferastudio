import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/auth-server';

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

    // Create a new test session
    const { data: session, error } = await supabase
      .from('test_sessions')
      .insert({
        test_id: testId,
        user_id: user.id,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        score: 0,
        time_spent: 0
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
    return NextResponse.json({ session });
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
    const { sessionId, status, score, timeSpent, endTime } = body;

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