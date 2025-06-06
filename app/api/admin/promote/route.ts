import { NextResponse } from 'next/server'
import { createServerSupabase } from '../../../lib/auth-server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    
    // Update the user's profile to make them admin
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)
    
    if (error) {
      console.error('Error promoting user to admin:', error)
      return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in promote endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}