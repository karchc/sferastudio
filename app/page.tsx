import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // User is logged in - redirect to dashboard
    redirect('/dashboard')
  } else {
    // User not logged in - redirect to login
    redirect('/auth/login')
  }
}
