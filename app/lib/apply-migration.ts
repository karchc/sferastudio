import { createClient } from '@supabase/supabase-js';

// Create a client with anon key
const supabase = createClient(
  'https://gezlcxtprkcceizadvre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
);

// Function to disable RLS for development
export async function disableRlsForDevelopment() {
  try {
    // This SQL will disable RLS for all tables
    const query = `
    ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tests DISABLE ROW LEVEL SECURITY;
    ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE answers DISABLE ROW LEVEL SECURITY;
    ALTER TABLE match_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE sequence_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE drag_drop_items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE test_questions DISABLE ROW LEVEL SECURITY;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      throw error;
    }
    
    return { success: true, message: 'RLS disabled for development' };
  } catch (error) {
    console.error('Error disabling RLS:', error);
    return { success: false, error };
  }
}

// Function to apply some permission bypass migrations
export async function setupDevAuth() {
  try {
    // This SQL will set up a development auth bypass
    const query = `
    -- Create a dev admin profile
    INSERT INTO profiles (id, email, full_name, is_admin)
    VALUES ('11111111-1111-1111-1111-111111111111', 'dev@example.com', 'Dev Admin', true)
    ON CONFLICT (id) DO UPDATE SET is_admin = true;
    
    -- Create or update policy to allow all operations from anon users for development
    CREATE POLICY IF NOT EXISTS dev_categories_all_policy ON categories
    FOR ALL USING (true) WITH CHECK (true);
    
    CREATE POLICY IF NOT EXISTS dev_tests_all_policy ON tests
    FOR ALL USING (true) WITH CHECK (true);
    
    CREATE POLICY IF NOT EXISTS dev_questions_all_policy ON questions
    FOR ALL USING (true) WITH CHECK (true);
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      throw error;
    }
    
    return { success: true, message: 'Development auth setup completed' };
  } catch (error) {
    console.error('Error setting up dev auth:', error);
    return { success: false, error };
  }
}