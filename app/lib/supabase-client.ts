import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('[Supabase Client] Missing environment variables:', { url: !!url, key: !!key })
    throw new Error('Supabase environment variables are not set')
  }

  client = createBrowserClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          // Parse all cookies from document.cookie
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(name + '='))
            ?.split('=')[1]
          
          
          return value ? decodeURIComponent(value) : undefined
        },
        set(name: string, value: string, options?: any) {
          const opts = {
            path: '/',
            ...options
          }
          
          let cookie = `${name}=${encodeURIComponent(value)}`
          
          if (opts.maxAge) cookie += `; Max-Age=${opts.maxAge}`
          if (opts.path) cookie += `; Path=${opts.path}`
          if (opts.domain) cookie += `; Domain=${opts.domain}`
          if (opts.secure) cookie += `; Secure`
          if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`
          
          document.cookie = cookie
        },
        remove(name: string, options?: any) {
          this.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  return client
}