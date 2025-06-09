import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // Use getUser() for secure authentication verification
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting user:", error);
      return NextResponse.json(
        { session: null },
        { status: 200 }
      );
    }

    // If user exists, create a session-like object
    const session = user ? {
      user,
      access_token: 'server-validated',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'server-validated'
    } : null;

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in GET /api/auth/session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}