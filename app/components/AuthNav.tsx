'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/auth-context'
import { ChevronDown, BarChart3, LogOut } from 'lucide-react'

interface Profile {
  full_name: string
  is_admin: boolean
}

export default function AuthNav() {
  const { user, profile, signOut, loading } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()



  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsDropdownOpen(false)
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-lg border-b-2 border-[#3EB3E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo/logo.svg"
                  alt="Practice SAP Logo"
                  width={150}
                  height={50}
                  className="mr-3 h-8 w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 rounded px-4 py-2 w-32 h-10"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-lg border-b-2 border-[#3EB3E7] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo/logo.svg"
                alt="Practice SAP Logo"
                width={120}
                height={30}
                className="mr-3 h-8 w-auto transition-transform group-hover:scale-105"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              /* All logged-in users get a dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-[#5C677D] hover:text-[#0B1F3A] hover:bg-[#F6F7FA] rounded-md transition-all duration-200 font-medium"
                >
                  <span className="text-sm">
                    {profile?.is_admin ? 'Admin' : (profile?.full_name || user.email)}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 transition-all duration-200 ${
                  isDropdownOpen 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}>
                  {profile?.is_admin ? (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Admin Dashboard
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                    </>
                  )}
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-5 py-2 text-[#0B1F3A] border border-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white rounded-md text-sm font-medium transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-5 py-2 bg-[#3EB3E7] hover:bg-[#2da0d4] text-white rounded-md text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Start Practicing Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}