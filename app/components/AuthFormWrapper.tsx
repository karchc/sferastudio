'use client'

import dynamic from 'next/dynamic'

// Load EmailAuthForm on client-side only to avoid hydration errors
const EmailAuthForm = dynamic(() => import('./EmailAuthForm'), { 
  ssr: false,
  loading: () => <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">Loading...</div>
})

export default function AuthFormWrapper() {
  return <EmailAuthForm />
}