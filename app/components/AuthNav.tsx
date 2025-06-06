'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClientSupabase } from '../lib/auth-client'
import { signOut } from '../lib/auth-client'
import { ChevronDown, BarChart3, BookOpen, LogOut } from 'lucide-react'

interface User {
  id: string
  email: string
}

interface Profile {
  full_name: string
  is_admin: boolean
}

export default function AuthNav() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClientSupabase()

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user as any || null)
      
      if (session?.user) {
        // Fetch user profile
        try {
          const response = await fetch('/api/auth/profile')
          if (response.ok) {
            const profileData = await response.json()
            setProfile(profileData)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user as any || null)
      
      if (session?.user) {
        try {
          const response = await fetch('/api/auth/profile')
          if (response.ok) {
            const profileData = await response.json()
            setProfile(profileData)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

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
                  alt="Test Engine Logo"
                  width={150}
                  height={50}
                  className="mr-3"
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
                alt="Test Engine Logo"
                width={120}
                height={30}
                className="mr-3 transition-transform group-hover:scale-110 overflow-hidden"
              />
            </Link>
              {!user && (
              <div className="flex space-x-1">
                <Link 
                  href="/test" 
                  className="flex items-center px-4 py-2 text-[#5C677D] hover:text-[#0B1F3A] hover:bg-[#F6F7FA] rounded-md transition-all duration-200 font-medium"
                >
                  TESTS
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-[#5C677D] hover:text-[#0B1F3A] hover:bg-[#F6F7FA] rounded-md transition-all duration-200 font-medium"
                >
                  <span className="text-sm">
                    {profile?.full_name || user.email}
                    {profile?.is_admin && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B1E5D3] text-[#0B1F3A]">
                        ADMIN
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    {profile?.is_admin ? (
                      <Link
                        href="/admin"
                        className="flex items-center px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                    )}
                    <Link
                      href="/test"
                      className="flex items-center px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <BookOpen className="h-4 w-4 mr-3" />
                      My Tests
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-[#5C677D] hover:bg-[#F6F7FA] hover:text-[#0B1F3A] transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
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