'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Import the dashboard component with no SSR to avoid hydration issues
const MuiDashboard = dynamic(
  () => import('./MuiDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ padding: '20px', fontSize: '16px', color: '#666' }}>
        Loading dashboard data...
      </div>
    )
  }
);

// Simple loading skeleton
const DashboardSkeleton = () => (
  <div style={{ padding: '20px' }}>
    <div style={{ width: '100%', height: '40px', background: '#f0f0f0', marginBottom: '20px', borderRadius: '4px' }}></div>
    <div style={{ display: 'flex', gap: '16px', marginBottom: '30px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ flex: 1, height: '120px', background: '#f0f0f0', borderRadius: '8px' }}></div>
      ))}
    </div>
    <div style={{ width: '100%', height: '300px', background: '#f0f0f0', marginBottom: '30px', borderRadius: '8px' }}></div>
  </div>
);

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MuiDashboard />
    </Suspense>
  );
}