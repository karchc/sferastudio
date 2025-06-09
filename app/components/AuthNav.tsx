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
  const supabaseRef = useRef(createClientSupabase())

  useEffect(() => {
    let isMounted = true;

    // Get initial session and profile
    const loadUserData = async () => {
      try {
        // Fetch session from API (using getUser for security)
        const sessionResponse = await fetch('/api/auth/session');
        if (!sessionResponse.ok) {
          setLoading(false);
          return;
        }
        
        const { session } = await sessionResponse.json();
        if (!isMounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch user profile
          try {
            const profileResponse = await fetch('/api/auth/profile', {
              // Add cache header to speed up subsequent loads
              headers: {
                'Cache-Control': 'max-age=60' // Cache for 1 minute
              }
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (isMounted) {
                setProfile(profileData);
              }
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    // Listen for auth changes with debouncing
    const supabase = supabaseRef.current;
    let profileFetchTimeout: NodeJS.Timeout;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      setUser(session?.user as any || null);
      
      // Clear any pending profile fetch
      if (profileFetchTimeout) {
        clearTimeout(profileFetchTimeout);
      }
      
      if (session?.user && event !== 'TOKEN_REFRESHED') {
        // Debounce profile fetch to avoid multiple requests
        profileFetchTimeout = setTimeout(async () => {
          try {
            const response = await fetch('/api/auth/profile');
            if (response.ok && isMounted) {
              const profileData = await response.json();
              setProfile(profileData);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
        }, 300); // Wait 300ms before fetching profile
      } else if (!session?.user) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      if (profileFetchTimeout) {
        clearTimeout(profileFetchTimeout);
      }
      subscription.unsubscribe();
    };
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
                alt="Test Engine Logo"
                width={120}
                height={30}
                className="mr-3 h-8 w-auto transition-transform group-hover:scale-105"
                priority
              />
            </Link>
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

                <div className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 transition-all duration-200 ${
                  isDropdownOpen 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}>
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