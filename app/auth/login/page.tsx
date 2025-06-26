'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../lib/auth-context'
import { signInWithMagicLink } from '../../lib/auth-client'
import { Button } from '@/app/components/ui/button'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')
  const { signIn, user, loading: authLoading } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const destination = redirectUrl || '/dashboard'
      router.push(destination)
    }
  }, [user, authLoading, router, redirectUrl])

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (loginMethod === 'magic-link') {
        const { data, error } = await signInWithMagicLink(email)
        
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Check your email for the magic link!')
        }
      } else {
        console.log('[Login] Starting sign in...')
        try {
          await signIn(email, password)
          console.log('[Login] Sign in successful, redirect will happen via useEffect')
          // Redirect will happen automatically via useEffect when user state updates
        } catch (signInError: any) {
          console.log('[Login] Sign in error:', signInError.message)
          setError(signInError.message)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        {/* Login method toggle */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`px-4 py-2 rounded-md ${
              loginMethod === 'password'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('magic-link')}
            className={`px-4 py-2 rounded-md ${
              loginMethod === 'magic-link'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Magic Link
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                  loginMethod === 'magic-link' ? 'rounded-md' : 'rounded-t-md'
                } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {loginMethod === 'password' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          {success && (
            <div className="text-green-600 text-sm text-center">{success}</div>
          )}

          <div>
            <Button
              type="submit"
              loading={loading}
              loadingText={loginMethod === 'magic-link' ? 'Sending Magic Link...' : 'Signing in...'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              size="lg"
            >
              {loginMethod === 'magic-link' ? 'Send Magic Link' : 'Sign in'}
            </Button>
          </div>
          
          {loginMethod === 'password' && (
            <div className="text-center">
              <Link
                href="/auth/reset-password"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}