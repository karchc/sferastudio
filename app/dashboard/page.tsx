"use client";

import MaterialDashboard from './MaterialDashboard';
import { SessionGuard } from '@/app/components/session/SessionGuard';

export default function Dashboard() {
  return (
    <SessionGuard>
      <MaterialDashboard />
    </SessionGuard>
  );
}