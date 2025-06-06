import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRedirect } from '../../lib/redirect-utils'

export async function POST(request: Request) {
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

  // Sign out the user
  await supabase.auth.signOut()

  // Redirect to the home page
  return createRedirect('/', request)
}