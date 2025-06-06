import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRedirect } from '../../lib/redirect-utils'
import { createSafeRedirect } from '../../lib/redirect-utils-safe'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  
  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async getAll() {
            return cookieStore.getAll()
          },
          async setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
    } else if (data?.user) {
      // Check if profile already exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      // If profile doesn't exist, create one
      if (profileError && !profile) {
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata.avatar_url,
          is_admin: false // Default to non-admin
        })
        
        if (insertError) {
          console.error('Error creating user profile:', insertError)
        }
      }
    }
  }

  // Check if this is a password recovery callback
  if (type === 'recovery') {
    return createSafeRedirect('/auth/reset-password/confirm', request)
  }

  // Redirect to dashboard
  return createSafeRedirect('/dashboard', request)
}