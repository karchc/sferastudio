import { createServerSupabaseClient } from '../server-supabase'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
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

  // Get user profile data from the database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

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
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{profile?.full_name || 'User'}</h2>
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