// COMMENTED OUT - Debug script for listing tests
// import { createClient } from '@supabase/supabase-js';

// Create direct Supabase client
// const supabase = createClient(
//   'https://gezlcxtprkcceizadvre.supabase.co',
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
// );

// List all tests
const listTests = async () => {
  try {
    const { data, error } = await supabase
      .from('tests')
      .select('id, title, description, category_id')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching tests:", error);
      return;
    }
    
    console.log(`Found ${data.length} tests:`);
    data.forEach((test, index) => {
      console.log(`${index + 1}. ID: ${test.id}`);
      console.log(`   Title: ${test.title}`);
      console.log(`   Description: ${test.description || 'N/A'}`);
      console.log(`   Category ID: ${test.category_id}`);
      console.log('---');
    });
  } catch (error) {
    console.error("Exception in listTests:", error);
  }
};

// Run the listing function
// await listTests();

// Also list all tables to verify questions vs questions naming
const listTables = async () => {
  try {
    const { data, error } = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error("Error listing tables:", error);
      return;
    }
    
    console.log("\nAvailable tables in public schema:");
    data.forEach(table => {
      console.log(`${table.schemaname}.${table.tablename}`);
    });
  } catch (error) {
    console.error("Exception in listTables:", error);
  }
};

// Try another approach to list tables
const rawTables = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_tables');
    
    if (error) {
      console.error("Error listing tables with RPC:", error);
      return;
    }
    
    console.log("\nTables from RPC call:");
    console.log(data);
  } catch (error) {
    console.error("Exception in rawTables:", error);
  }
};

// Run table listing
// await listTables();
// await rawTables();