"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClientSupabase } from './supabase';

// Types for our auth context
type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  profile: any;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClientSupabase());
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check admin status and fetch profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setProfile(data);
      setIsAdmin(!!data?.is_admin);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
      setIsAdmin(false);
    }
  };

  // Effect to handle auth state changes
  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener - this handles all auth events including INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      // Synchronous state updates as recommended by Supabase docs
      if (session?.user) {
        setUser(session.user);
        // Fetch profile asynchronously but don't block the auth state update
        fetchUserProfile(session.user.id).catch(console.error);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      
      // Always set loading to false after any auth event
      setLoading(false);
    });

    // Get initial user state using getUser() as recommended by docs
    // This is more reliable than getSession()
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!isMounted) return;
      
      if (user && !error) {
        setUser(user);
        fetchUserProfile(user.id).catch(console.error);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting user:', error);
      if (isMounted) {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    // Auth state change will be handled by the listener
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) throw error;
    // Auth state change will be handled by the listener
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Auth state change will be handled by the listener
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{ user, isAdmin, profile, signIn, signUp, signOut, loading }}>
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