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

  // Check if this is a fetch request (Ajax/XHR)
  const contentType = request.headers.get('content-type')
  const acceptHeader = request.headers.get('accept')
  const isFetchRequest = contentType?.includes('application/json') || 
                         acceptHeader?.includes('application/json')

  if (isFetchRequest) {
    // Return JSON response for fetch requests
    return new Response(JSON.stringify({ success: true, redirect: '/' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  // Redirect for regular navigation
  return createRedirect('/', request)
}