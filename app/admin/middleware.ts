import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabase } from '../supabase';

export async function middleware(request: NextRequest) {
  try {
    const supabase = createClientSupabase();
    
    // Check if user is authenticated and an admin
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // If not authenticated or no user, redirect to login
    if (error || !user) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    // Check if admin
    const isAdmin = user.app_metadata?.is_admin === true;
    
    // If not an admin, check the profiles table
    if (!isAdmin) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile || !profile.is_admin) {
        // Not an admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    // Admin can proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    // Error, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: '/admin/:path*',
}