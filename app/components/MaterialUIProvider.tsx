// MaterialUIProvider.tsx
'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';
import theme from '../lib/theme';
import { useEffect, useState } from 'react';

interface MaterialUIProviderProps {
  children: ReactNode;
}

export default function MaterialUIProvider({ children }: MaterialUIProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR issues by only rendering after mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}