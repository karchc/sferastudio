import { createClient } from '@supabase/supabase-js';

// This client uses service_role key which bypasses RLS policies
// WARNING: This should only be used server-side for admin functions
export const adminSupabaseClient = createClient(
  'https://gezlcxtprkcceizadvre.supabase.co',
  // Note: In production, you would use an environment variable for the service role key
  // Using placeholder since we don't have the actual service role key
  'SERVICE_ROLE_KEY_PLACEHOLDER'
);

// Helper to check if we're on the server side
export const isServer = () => typeof window === 'undefined';

// Function to create a bypass client with EITHER:
// 1. Service role key on server side
// 2. Anon key on client side
export const createBypassClient = () => {
  // Create a client with a dummy auth context
  const client = createClient(
    'https://gezlcxtprkcceizadvre.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
  );
  
  return client;
};