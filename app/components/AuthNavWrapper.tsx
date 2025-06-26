'use client'

import { useAuth } from '../lib/auth-context'
import AuthNav from './AuthNav'

export default function AuthNavWrapper() {
  const { loading } = useAuth()

  // During initial auth loading, show loading state
  if (loading) {
    return (
      <nav className="bg-white shadow-lg border-b-2 border-[#3EB3E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return <AuthNav />
}