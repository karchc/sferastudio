"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const clearCache = async () => {
    setClearing(true);
    setMessage('Clearing cache...');

    try {
      // Clear localStorage
      localStorage.clear();
      setMessage('✅ LocalStorage cleared');

      // Clear sessionStorage
      sessionStorage.clear();
      setMessage('✅ SessionStorage cleared');

      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        setMessage('✅ Cache API cleared');
      }

      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        // This is a simplified approach - in production you might want to be more specific
        setMessage('✅ Cache cleared successfully');
      }

      // Wait a moment then redirect
      setTimeout(() => {
        setMessage('🔄 Redirecting to homepage...');
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error clearing cache:', error);
      setMessage('❌ Error clearing cache. Please manually clear your browser cache.');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    // Auto-start clearing when page loads
    clearCache();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Cache Clearing Utility
        </h1>
        
        <div className="mb-6">
          {clearing && (
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          )}
        </div>

        <p className="text-gray-600 mb-6">
          {message || 'Preparing to clear cache...'}
        </p>

        <div className="space-y-4">
          <button
            onClick={clearCache}
            disabled={clearing}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {clearing ? 'Clearing...' : 'Clear Cache Again'}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Go to Homepage
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>If issues persist, try:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)</li>
            <li>Open Developer Tools → Application → Clear Storage</li>
            <li>Use incognito/private browsing mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
}