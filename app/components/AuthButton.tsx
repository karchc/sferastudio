'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClientSupabase } from '../supabase'

// Mock user for authentication bypass
const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  role: 'authenticated',
  app_metadata: {
    provider: 'bypass',
    is_admin: true,
  },
};

export default function AuthButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientSupabase()
  
  // Auth has been disabled, always show as signed in with mock user
  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      // Just redirect to home without actually signing out
      router.refresh()
      router.push('/')
    } catch (error) {
      console.error('Error navigating:', error)
    } finally {
      setIsLoading(false) 
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <span className="text-sm">Signed in as {mockUser.email} (Auth disabled)</span>
        <button 
          onClick={handleSignOut} 
          disabled={isLoading}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Home'}
        </button>
      </div>
    </div>
  )
}