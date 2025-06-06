import { createClientSupabase } from '../supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import React from 'react';

// Check if a user is an admin
export async function checkAdminAccess() {
  try {
    const supabase = createClientSupabase();
    
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // Not logged in
      return false;
    }
    
    // Check if user has admin app metadata
    if (user.app_metadata?.is_admin === true) {
      return true;
    }
    
    // If not in app metadata, check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return false;
    }
    
    return profile.is_admin === true;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

// Middleware to protect admin routes on the client side
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  // We'll wrap this in a React component that performs the check
  // and redirects non-admin users
  return children;
}

// HOC for admin pages
export function withAdminAuth(Component: React.ComponentType) {
  return function WithAdminAuth(props: any) {
    // In a real implementation, we'd check auth here
    // and redirect non-admins
    return React.createElement(Component, props);
  };
}

// Server-side function to use in Server Components or middleware
export async function requireAdmin() {
  const isAdmin = await checkAdminAccess();
  
  if (!isAdmin) {
    redirect('/');
  }
}

// Client-side admin auth functions

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Get the admin profile from localStorage
export function getAdminProfile() {
  if (!isBrowser) return null;
  
  try {
    const adminProfileJSON = localStorage.getItem('adminProfile');
    if (!adminProfileJSON) return null;
    
    return JSON.parse(adminProfileJSON);
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return null;
  }
}

// Check if the user is authenticated as admin
export function isAdminAuthenticated() {
  return !!getAdminProfile();
}

// Get a Supabase client with admin context
export function getAdminSupabaseClient(): SupabaseClient {
  const supabase = createClient(
    'https://gezlcxtprkcceizadvre.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
  );
  
  return supabase;
}

// Admin category operations
export const adminCategoryOperations = {
  // Get all categories
  async getAll() {
    const supabase = getAdminSupabaseClient();
    
    // Try to fetch normally
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  
  // Create a category
  async create(categoryData: { name: string; description?: string }) {
    const supabase = getAdminSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description
        })
        .select();
        
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },
  
  // Update a category
  async update(id: string, categoryData: { name: string; description?: string }) {
    const supabase = getAdminSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          description: categoryData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      return data[0];
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },
  
  // Delete a category
  async delete(id: string) {
    const supabase = getAdminSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};