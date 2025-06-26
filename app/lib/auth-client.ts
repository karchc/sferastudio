import { getSupabaseClient } from './supabase-client'

export function createClientSupabase() {
  return getSupabaseClient()
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClientSupabase()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  })
  
  return { data, error }
}

export async function signIn(email: string, password: string) {
  console.log('[Auth Client] Creating Supabase client...')
  const supabase = createClientSupabase()
  
  console.log('[Auth Client] Calling signInWithPassword...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  console.log('[Auth Client] Sign in response:', { hasUser: !!data?.user, error: error?.message })
  
  return { data, error }
}

export async function signOut() {
  const supabase = createClientSupabase()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function signInWithMagicLink(email: string) {
  const supabase = createClientSupabase()
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  return { data, error }
}