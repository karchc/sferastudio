/**
 * Test script to verify table name changes work correctly
 * Run with: node app/debug/test-table-names.js
 */

// Import the Supabase client
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function main() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase URL and Anon Key are required!');
    console.error('Set them as environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('Testing table names after migration...');
  
  // Test tables that should exist based on initial migration schema
  const tablesToCheck = [
    'tests',
    'questions',
    'answers',
    'test_questions',
    'match_items',
    'sequence_items',
    'drag_drop_items'
  ];
  
  // Tables that should NOT exist
  const oldTables = [
    'questions',
    'answers'
  ];
  
  // Check all tables
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`✖ Table '${table}' access error:`, error.message);
      } else {
        console.log(`✓ Table '${table}' exists with ${count} records`);
      }
    } catch (error) {
      console.error(`⚠ Error checking table '${table}':`, error.message);
    }
  }
  
  // Check old tables - they should not exist or be empty after migration
  for (const table of oldTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`✓ Old table '${table}' does not exist or is not accessible`);
      } else {
        console.error(`⚠ Warning: Old table '${table}' still exists with ${count} records`);
      }
    } catch (error) {
      console.log(`✓ Old table '${table}' generated error as expected:`, error.message);
    }
  }

  // Test a basic query with the new table names
  try {
    console.log('\nTesting a basic query with new table names...');
    
    // Join between test_questions and questions
    const { data, error } = await supabase
      .from('test_questions')
      .select(`
        *,
        questions (*)
      `)
      .limit(1);
    
    if (error) {
      console.error('✖ Join query failed:', error.message);
    } else {
      console.log('✓ Join query successful!');
      if (data && data.length > 0) {
        console.log(`  Found test_question with ID: ${data[0].id}`);
        if (data[0].questions) {
          console.log(`  Joined with question: ${data[0].questions.id}`);
        } else {
          console.log('  No joined question found');
        }
      } else {
        console.log('  No data returned');
      }
    }
  } catch (error) {
    console.error('⚠ Error running join query:', error.message);
  }
  
  console.log('\nTable name test complete!');
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});