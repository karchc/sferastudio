'use client'

import { useAuth } from '../lib/auth-context'
import { useEffect, useState } from 'react'
import { createClientSupabase } from '../lib/auth-client'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [directCheck, setDirectCheck] = useState<any>(null)

  useEffect(() => {
    const checkDirectly = async () => {
      const supabase = createClientSupabase()
      const { data: { session }, error } = await supabase.auth.getSession()
      setDirectCheck({ session: !!session, email: session?.user?.email, error })
    }
    checkDirectly()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Auth Context State:</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>User: {user ? user.email : 'None'}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Direct Supabase Check:</h2>
          <pre>{JSON.stringify(directCheck, null, 2)}</pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Window Location:</h2>
          <p>{typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}