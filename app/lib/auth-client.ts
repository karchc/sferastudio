import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClientSupabase() {
  // Return existing client if already created to prevent multiple instances
  if (supabaseClient) return supabaseClient
  
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return supabaseClient
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
  const supabase = createClientSupabase()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
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