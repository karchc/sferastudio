import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client uses service_role key which bypasses RLS policies
// WARNING: This should only be used server-side for admin functions like webhooks
export const createServiceRoleClient = () => {
  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Some operations may fail due to RLS policies.');
    // Fallback to anon key (will respect RLS)
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Legacy export for backward compatibility
export const adminSupabaseClient = createServiceRoleClient();

// Helper to check if we're on the server side
export const isServer = () => typeof window === 'undefined';

// Function to create a bypass client with EITHER:
// 1. Service role key on server side
// 2. Anon key on client side
export const createBypassClient = () => {
  // Create a client with anon key
  const client = createClient(supabaseUrl, supabaseAnonKey);

  return client;
};