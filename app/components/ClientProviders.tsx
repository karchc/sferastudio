'use client';

import { AuthProvider } from '../lib/auth-context';
import MaterialUIProvider from './MaterialUIProvider';
import AuthErrorBoundary from './AuthErrorBoundary';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MaterialUIProvider>
      <AuthErrorBoundary>
        <AuthProvider>
          {children}
        </AuthProvider>
      </AuthErrorBoundary>
    </MaterialUIProvider>
  );
}