// Server-side Supabase client
// This file is for server components only and should NOT be used in client components

import { createServerSupabase } from './lib/auth-server'

// For server components only - use the auth-aware server client
export const createServerSupabaseClient = createServerSupabase