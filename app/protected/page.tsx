import { requireAuth, getUserProfile } from '../lib/auth-server'
import SignOutButton from '../components/SignOutButton'
import Link from 'next/link'

export default async function ProtectedPage() {
  const session = await requireAuth()
  const profile = await getUserProfile()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Protected Page</h1>
            <SignOutButton />
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">User Information</h2>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Email:</span> {session.user.email}</p>
                <p><span className="font-medium">User ID:</span> {session.user.id}</p>
                <p><span className="font-medium">Full Name:</span> {profile?.full_name || 'Not set'}</p>
                <p><span className="font-medium">Admin:</span> {profile?.is_admin ? 'Yes' : 'No'}</p>
                <p><span className="font-medium">Account Created:</span> {new Date(session.user.created_at).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-700">Navigation</h2>
              <div className="mt-2 space-x-4">
                {profile?.is_admin ? (
                  <Link href="/admin" className="text-indigo-600 hover:text-indigo-500">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                    User Dashboard
                  </Link>
                )}
                <Link href="/test" className="text-indigo-600 hover:text-indigo-500">
                  Tests
                </Link>
                <Link href="/profile" className="text-indigo-600 hover:text-indigo-500">
                  Profile
                </Link>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold text-gray-700">Session Information</h2>
              <div className="mt-2 text-sm text-gray-600">
                <p>Access Token: {session.access_token.substring(0, 20)}...</p>
                <p>Expires: {new Date(session.expires_at! * 1000).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}