import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This is an API route that sets up a mock admin profile for development
export async function POST(request: Request) {
  try {
    const supabase = createClient(
      'https://gezlcxtprkcceizadvre.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
    );
    
    // Insert a mock admin profile
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@example.com',
        full_name: 'Admin User',
        is_admin: true
      }, {
        onConflict: 'id'
      })
      .select();
      
    if (error) {
      console.error('Error creating admin profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Create policy to allow all operations for development
    const { error: policyError } = await supabase.rpc('exec_sql', {
      query: `
      -- Create or update policy to allow all operations from anon users for development
      DO $$
      BEGIN
        -- For categories
        IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE polname = 'dev_categories_all_policy') THEN
          CREATE POLICY dev_categories_all_policy ON categories
          FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END
      $$;
      `
    });
    
    if (policyError) {
      console.error('Error creating policy:', policyError);
      return NextResponse.json({ warning: 'Admin profile created but policy setup failed' }, { status: 200 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin profile created successfully',
      data
    });
  } catch (error) {
    console.error('Error in setup-profile route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}