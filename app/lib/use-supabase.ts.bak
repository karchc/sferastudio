'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return browserClient
}

export function useSupabase() {
  const [supabase] = useState(() => {
    if (typeof window === 'undefined') {
      // During SSR, return a placeholder that will be replaced on client
      return null as any
    }
    return getSupabaseBrowserClient()
  })

  // Ensure we have a client after hydration
  useEffect(() => {
    if (!supabase && typeof window !== 'undefined') {
      // Force re-render with client if needed
      console.warn('Supabase client was not initialized properly')
    }
  }, [supabase])

  return supabase || getSupabaseBrowserClient()
}