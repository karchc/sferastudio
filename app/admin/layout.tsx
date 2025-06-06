'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Import the layout component with no SSR to avoid hydration issues
const MuiDashboardLayout = dynamic(
  () => import('@/app/components/admin/MuiDashboardLayout').then(mod => mod.MuiDashboardLayout),
  { 
    ssr: false,
    loading: () => <div style={{ padding: '20px' }}>Loading dashboard layout...</div>
  }
);

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading admin interface...</div>}>
      <MuiDashboardLayout>
        <Suspense fallback={<div style={{ padding: '20px' }}>Loading content...</div>}>
          {children}
        </Suspense>
      </MuiDashboardLayout>
    </Suspense>
  );
}