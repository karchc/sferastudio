'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '../lib/auth-client'

export default function SignOutButton({ className = '' }: { className?: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className={`px-4 py-2 text-[#0B1F3A] border border-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white rounded-md text-sm font-medium transition-all duration-200 ${className}`}
    >
      Sign Out
    </button>
  )
}