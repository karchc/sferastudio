'use client'

import { useAuth } from '../lib/auth-context'
import AuthNav from './AuthNav'
import { useEffect, useState } from 'react'

export default function AuthNavWrapper() {
  const { loading } = useAuth()
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Only show loading for a maximum of 1 second
    // This prevents the navbar from being stuck in loading state
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 1000)

    // If auth loads before timeout, hide loading immediately
    if (!loading) {
      setShowLoading(false)
    }

    return () => clearTimeout(timer)
  }, [loading])

  // Show loading state only if both auth is loading AND we haven't hit the timeout
  if (loading && showLoading) {
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

  // Always render the nav after timeout, regardless of auth state
  return <AuthNav />
}