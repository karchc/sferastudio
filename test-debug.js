// COMMENTED OUT - Debug script for test debugger
// const { createClient } = require('@supabase/supabase-js');

// async function testDebugger() {
  console.log('Starting test debugger test...');
  
  try {
    // Create Supabase client
    const supabase = createClient(
      'https://gezlcxtprkcceizadvre.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
    );
    
    console.log('Fetching test from Supabase...');
    
    // 1. Test if we can fetch the test
    console.log('\n--- Step 1: Fetch test ---');
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('*')
      .eq('id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
      .single();
      
    if (testError) {
      console.error('Error fetching test:', testError);
      return;
    }
    
    console.log('Test data:', testData);
    
    // 2. Check if we can fetch questions
    console.log('\n--- Step 2: Fetch questions ---');
    const { data: questionsData, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
      .order('position', { ascending: true });
      
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log(`Found ${questionsData.length} questions`);
    console.log('First question:', questionsData[0]);
    
    // This matches what the debug page should do when "Fetch Test" is clicked
    console.log('\n=== Summary ===');
    console.log(`Test "${testData.title}" exists with ${questionsData.length} questions`);
    console.log('Test debugger should be able to load this test correctly');
  } catch (error) {
    console.error('Unexpected error in test:', error);
  }
// }

// testDebugger();