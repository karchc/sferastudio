'use client'

import { useEffect, useState } from 'react'
import { createClientSupabase } from '../supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientSupabase()

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setLoading(false)
        return
      }
      
      setSession(session)
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      setProfile(profile)
      setFullName(profile?.full_name || '')
      setLoading(false)
    }
    
    loadProfile()
  }, [])

  const handleSave = async () => {
    if (!session) return
    
    setSaving(true)
    setError('')
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', session.user.id)
      
      if (error) throw error
      
      setProfile({ ...profile, full_name: fullName })
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(profile?.full_name || '')
    setIsEditing(false)
    setError('')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <div className="text-2xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <main className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <h1 className="text-4xl font-bold mb-8">You need to be signed in</h1>
          <p className="mb-8">Please sign in to view your profile</p>
          <Link 
            href="/"
            className="rounded-full border border-solid border-transparent bg-blue-600 text-white py-2 px-6 hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-8 max-w-4xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">Your Profile</h1>
        
        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  {profile?.full_name?.[0] || profile?.email?.[0] || '?'}
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between mb-4">
                {isEditing ? (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-2xl font-bold mb-2 w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    {error && (
                      <p className="text-red-500 text-sm mt-1">{error}</p>
                    )}
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold mb-2">{profile?.full_name || 'User'}</h2>
                )}
                
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Name
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">{session.user.email}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium mb-2">Account Type</h3>
                  <p>{profile?.is_admin ? 'Administrator' : 'Student'}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-medium mb-2">Member Since</h3>
                  <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium px-5 py-2"
          >
            Dashboard
          </Link>
          <form action="/auth/signout" method="post">
            <button 
              type="submit"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white hover:bg-red-700 font-medium px-5 py-2"
            >
              Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}