'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveSession } from '@/app/hooks/useActiveSession';

interface SessionGuardProps {
  children: React.ReactNode;
  /**
   * If true, skips the active session check (for pages like test page itself)
   */
  skipCheck?: boolean;
}

export function SessionGuard({ children, skipCheck = false }: SessionGuardProps) {
  const router = useRouter();
  const { activeSession, loading } = useActiveSession(skipCheck);

  useEffect(() => {
    if (loading || skipCheck) return;

    if (activeSession) {
      const { status, test_id, id } = activeSession;

      // Handle different session statuses
      if (status === 'in_progress') {
        // Redirect to the active test
        console.log(`[SessionGuard] Active session found, redirecting to test: ${test_id}`);
        router.push(`/test/${test_id}`);
      } else if (status === 'expired' || status === 'completed') {
        // Redirect to results page
        console.log(`[SessionGuard] ${status} session found, redirecting to results`);
        router.push(`/test/${test_id}/results?session=${id}`);
      }
    }
  }, [activeSession, loading, skipCheck, router]);

  // Show loading state while checking
  if (loading && !skipCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking for active sessions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
