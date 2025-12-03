'use client';

import { useEffect, useState } from 'react';
import { createClientSupabase } from '@/app/lib/supabase';

export interface ActiveSession {
  id: string;
  test_id: string;
  start_time: string;
  time_spent: number;
  status: 'in_progress' | 'completed' | 'expired';
  test?: {
    id: string;
    title: string;
    time_limit: number;
  };
}

/**
 * Check if user is an admin
 */
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  try {
    // Check app_metadata first
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.is_admin === true) {
      return true;
    }

    // Check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    return profile?.is_admin === true;
  } catch {
    return false;
  }
}

export function useActiveSession(skipCheck = false) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skipCheck) {
      setLoading(false);
      return;
    }

    async function checkForActiveSession() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClientSupabase();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          // No user, no active session
          setActiveSession(null);
          setLoading(false);
          return;
        }

        // Skip session check for admins - they don't have stored sessions
        const isAdmin = await checkIsAdmin(supabase, user.id);
        if (isAdmin) {
          setActiveSession(null);
          setLoading(false);
          return;
        }

        // Query for active sessions
        const { data: sessions, error: sessionError } = await (supabase as any)
          .from('test_sessions')
          .select(`
            id,
            test_id,
            start_time,
            time_spent,
            status,
            tests (
              id,
              title,
              time_limit
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .order('start_time', { ascending: false })
          .limit(1);

        if (sessionError) {
          console.error('Error checking for active session:', sessionError);
          setError(sessionError.message);
          setActiveSession(null);
          setLoading(false);
          return;
        }

        if (!sessions || sessions.length === 0) {
          setActiveSession(null);
          setLoading(false);
          return;
        }

        const session = sessions[0];

        // Check if session is actually expired based on time
        const startTime = new Date(session.start_time).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const timeLimit = (session.tests as any)?.time_limit || 3600;

        if (elapsed >= timeLimit) {
          // Session has expired, update it
          await (supabase as any)
            .from('test_sessions')
            .update({ status: 'expired' })
            .eq('id', session.id);

          setActiveSession({
            ...session,
            status: 'expired',
            test: (session.tests as any) ? {
              id: (session.tests as any).id,
              title: (session.tests as any).title,
              time_limit: (session.tests as any).time_limit,
            } : undefined,
          });
        } else {
          // Session is still active
          setActiveSession({
            ...session,
            test: (session.tests as any) ? {
              id: (session.tests as any).id,
              title: (session.tests as any).title,
              time_limit: (session.tests as any).time_limit,
            } : undefined,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error in useActiveSession:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setActiveSession(null);
        setLoading(false);
      }
    }

    checkForActiveSession();
  }, [skipCheck]);

  return { activeSession, loading, error };
}
