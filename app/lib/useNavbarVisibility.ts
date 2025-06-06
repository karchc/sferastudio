'use client';

import { useEffect } from 'react';

export function useNavbarVisibility(isVisible: boolean) {
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = isVisible ? 'block' : 'none';
    }
    
    // Cleanup: show navbar when component unmounts
    return () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        navbar.style.display = 'block';
      }
    };
  }, [isVisible]);
}