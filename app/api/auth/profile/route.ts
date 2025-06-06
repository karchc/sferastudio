import { NextResponse } from 'next/server'
import { getUserProfile } from '../../../lib/auth-server'

export async function GET() {
  try {
    const profile = await getUserProfile()
    
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}