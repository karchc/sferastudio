// Client-side mock auth utilities for bypassing authentication
import { createClient } from '@supabase/supabase-js';

// Mock user for authentication bypass
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  role: 'authenticated',
  app_metadata: {
    provider: 'bypass',
    is_admin: true,
  },
};

// Mock session for authentication bypass
export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockUser,
};

// Mock auth response
export const mockAuthResponse = {
  data: {
    session: mockSession,
    user: mockUser,
  },
  error: null,
};

// Create a client-side enhanced Supabase client with mocked auth
export function createEnhancedSupabaseClient(supabase: any) {  
  // Add debug logging to detect issues
  const originalFrom = supabase.from.bind(supabase);
  
  // Enhanced from method with logging
  const enhancedFrom = (table: string) => {
    console.log(`Supabase request to table: ${table}`);
    
    const originalMethods = originalFrom(table);
    
    // Wrap the select method to add logging
    const originalSelect = originalMethods.select.bind(originalMethods);
    originalMethods.select = (...args: any[]) => {
      console.log(`  - select called on table: ${table} with args:`, args);
      return originalSelect(...args);
    };
    
    return originalMethods;
  };
  
  // Make sure we're not losing the original methods we need
  const enhancedClient = {
    ...supabase,
    auth: {
      ...supabase.auth,
      // Override getSession to always return a mock session
      getSession: async () => mockAuthResponse,
      // Override getUser to always return a mock user
      getUser: async () => ({ data: { user: mockUser }, error: null }),
      // Override signInWithOAuth to immediately "succeed"
      signInWithOAuth: async () => ({ data: mockAuthResponse.data, error: null }),
      // Override signOut to do nothing
      signOut: async () => ({ error: null }),
      // Override onAuthStateChange to immediately call with authenticated state
      onAuthStateChange: (callback: any) => {
        // Immediately call callback with mock session
        setTimeout(() => {
          callback('SIGNED_IN', mockAuthResponse.data.session);
        }, 0);
        // Return mock subscription that does nothing
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    // Replace standard methods with enhanced logging versions
    from: enhancedFrom,
    rpc: supabase.rpc.bind(supabase),
    storage: supabase.storage
  };
  
  // Add debugging method to check connectivity
  enhancedClient.testConnection = async () => {
    try {
      // Try a simple query to test the connection
      const { data, error } = await supabase.from('tests').select('count').limit(1);
      return { 
        success: !error, 
        data, 
        error,
        message: error ? `Connection failed: ${error.message}` : 'Connection successful'
      };
    } catch (e) {
      return { 
        success: false, 
        error: e,
        message: `Exception during connection test: ${e}`
      };
    }
  };
  
  console.log('Enhanced Supabase client created with auth bypass');
  return enhancedClient;
}