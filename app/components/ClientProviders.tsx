'use client';

import { AuthProvider } from '../lib/auth-context';
import MaterialUIProvider from './MaterialUIProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <MaterialUIProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MaterialUIProvider>
  );
}