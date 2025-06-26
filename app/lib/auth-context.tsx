"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

// Types for our auth context
type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  supabase: SupabaseClient;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => getSupabaseClient());
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect to handle auth state changes
  useEffect(() => {
    if (!supabase || !mounted) return;
    
    let cleanup = true;
    let initialLoadingTimeout: NodeJS.Timeout;

    // Timeout to prevent infinite loading - give more time for token reconstruction
    initialLoadingTimeout = setTimeout(() => {
      if (cleanup) {
        setLoading(false);
      }
    }, 6000);

    // Check admin status
    const checkAdminStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        if (cleanup) {
          setIsAdmin(!!data?.is_admin);
        }
      } catch (error) {
        if (cleanup) {
          setIsAdmin(false);
        }
      }
    };

    // First, refresh the session to ensure we have the latest token
    supabase.auth.refreshSession().then(({ data: { session }, error }) => {
      if (cleanup && session) {
        setUser(session.user);
        checkAdminStatus(session.user.id);
        setLoading(false);
        clearTimeout(initialLoadingTimeout);
      }
    });

    // Set up subscription to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!cleanup) return;
      
      // Clear the initial loading timeout since we got an auth event
      clearTimeout(initialLoadingTimeout);
      
      setUser(session?.user || null);
      
      if (session?.user) {
        await checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
      
      // Always set loading to false when we get an auth state change
      setLoading(false);
    });

    // Try to get initial session with timeout
    const checkInitialSession = async () => {
      try {
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 3000);
        });
        
        // Race between getSession and timeout
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        
        if (cleanup) {
          if (session) {
            setUser(session.user);
            await checkAdminStatus(session.user.id);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
          
          setLoading(false);
          clearTimeout(initialLoadingTimeout);
        }
      } catch (error) {
        
        // If timeout, try alternative method
        if (error && (error as Error).message === 'Session check timeout') {
          
          // Get user from storage directly as fallback
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (cleanup) {
              if (user) {
                setUser(user);
                await checkAdminStatus(user.id);
              } else {
                setUser(null);
                setIsAdmin(false);
              }
            }
          } catch (fallbackError) {
          }
        }
        
        if (cleanup) {
          setLoading(false);
          clearTimeout(initialLoadingTimeout);
        }
      }
    };
    
    // Run the check immediately
    checkInitialSession();
    

    // Cleanup subscription
    return () => {
      cleanup = false;
      clearTimeout(initialLoadingTimeout);
      subscription.unsubscribe();
    };
  }, [supabase, mounted]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{ user, isAdmin, supabase, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}