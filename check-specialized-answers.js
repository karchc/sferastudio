// COMMENTED OUT - Script to check specialized answer tables
// const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from .env.local
// const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
// const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIxMTE2MywiZXhwIjoyMDYyNzg3MTYzfQ.EY5mDxpPhFjnlFhhN69c918Spb9PVtlwI7xELK59xws';

// Test ID to analyze
// const testId = 'ee6d5721-45e0-4ceb-a024-d7d5eee8e145';

// async function checkSpecializedAnswers() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client created');
    
    // Fetch questions for this test
    console.log(`\nFetching questions for test ID: ${testId}`);
    const { data: testQuestions, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId);
      
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log(`Found ${testQuestions.length} questions total`);
    
    // Group questions by type
    const questionsByType = {};
    testQuestions.forEach(q => {
      const type = q.questions?.type || 'unknown';
      if (!questionsByType[type]) {
        questionsByType[type] = [];
      }
      questionsByType[type].push(q.question_id);
    });
    
    console.log('\nQuestion types:');
    Object.entries(questionsByType).forEach(([type, ids]) => {
      console.log(`- ${type}: ${ids.length} questions`);
    });
    
    // Check sequence questions
    if (questionsByType['sequence'] && questionsByType['sequence'].length > 0) {
      console.log('\nChecking sequence questions...');
      const sequenceQuestionIds = questionsByType['sequence'];
      
      // First check if table exists by checking its schema
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('list_tables');
        
        if (tableError) {
          console.log('Could not check table schema:', tableError);
        } else {
          console.log('Tables found:', tableInfo ? tableInfo.length : 0);
          const sequenceTable = tableInfo?.find(t => t === 'sequence_items');
          console.log('Sequence table exists:', !!sequenceTable);
        }
      } catch (e) {
        console.log('Error checking table schema:', e);
      }
      
      // Check for sequence items
      const { data: sequenceItems, error: sequenceError } = await supabase
        .from('sequence_items')
        .select('*')
        .in('question_id', sequenceQuestionIds);
        
      if (sequenceError) {
        console.error('Error fetching sequence items:', sequenceError);
        
        // Try with a basic Supabase query to the table
        try {
          const { data, error } = await supabase
            .from('sequence_items')
            .select('count');
            
          console.log('Direct query to sequence_items:', error ? 'Failed' : `${data ? 'Succeeded' : 'No data'}`);
        } catch (e) {
          console.log('Exception querying sequence_items table directly:', e);
        }
      } else {
        console.log(`Found ${sequenceItems?.length || 0} sequence items`);
        
        // Group by question_id
        const itemsByQuestion = {};
        sequenceItems?.forEach(item => {
          if (!itemsByQuestion[item.question_id]) {
            itemsByQuestion[item.question_id] = [];
          }
          itemsByQuestion[item.question_id].push(item);
        });
        
        console.log(`Questions with sequence items: ${Object.keys(itemsByQuestion).length}`);
      }
    }
    
    // Check matching questions
    if (questionsByType['matching'] && questionsByType['matching'].length > 0) {
      console.log('\nChecking matching questions...');
      const matchingQuestionIds = questionsByType['matching'];
      
      // Check for match items
      const { data: matchItems, error: matchError } = await supabase
        .from('match_items')
        .select('*')
        .in('question_id', matchingQuestionIds);
        
      if (matchError) {
        console.error('Error fetching match items:', matchError);
        
        // Try with a basic Supabase query to the table
        try {
          const { data, error } = await supabase
            .from('match_items')
            .select('count');
            
          console.log('Direct query to match_items:', error ? 'Failed' : `${data ? 'Succeeded' : 'No data'}`);
        } catch (e) {
          console.log('Exception querying match_items table directly:', e);
        }
      } else {
        console.log(`Found ${matchItems?.length || 0} match items`);
        
        // Group by question_id
        const itemsByQuestion = {};
        matchItems?.forEach(item => {
          if (!itemsByQuestion[item.question_id]) {
            itemsByQuestion[item.question_id] = [];
          }
          itemsByQuestion[item.question_id].push(item);
        });
        
        console.log(`Questions with match items: ${Object.keys(itemsByQuestion).length}`);
      }
    }
    
    // Check drag-drop questions
    if (questionsByType['drag-drop'] && questionsByType['drag-drop'].length > 0) {
      console.log('\nChecking drag-drop questions...');
      const dragDropQuestionIds = questionsByType['drag-drop'];
      
      // Check for drag-drop items
      const { data: dragDropItems, error: dragDropError } = await supabase
        .from('drag_drop_items')
        .select('*')
        .in('question_id', dragDropQuestionIds);
        
      if (dragDropError) {
        console.error('Error fetching drag-drop items:', dragDropError);
        
        // Try with a basic Supabase query to the table
        try {
          const { data, error } = await supabase
            .from('drag_drop_items')
            .select('count');
            
          console.log('Direct query to drag_drop_items:', error ? 'Failed' : `${data ? 'Succeeded' : 'No data'}`);
        } catch (e) {
          console.log('Exception querying drag_drop_items table directly:', e);
        }
      } else {
        console.log(`Found ${dragDropItems?.length || 0} drag-drop items`);
        
        // Group by question_id
        const itemsByQuestion = {};
        dragDropItems?.forEach(item => {
          if (!itemsByQuestion[item.question_id]) {
            itemsByQuestion[item.question_id] = [];
          }
          itemsByQuestion[item.question_id].push(item);
        });
        
        console.log(`Questions with drag-drop items: ${Object.keys(itemsByQuestion).length}`);
      }
    }
    
    // List all tables for reference
    console.log('\nChecking available tables...');
    try {
      // Try to list tables using an information schema query
      const { data: tableList, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (tableError) {
        console.error('Error listing tables:', tableError);
      } else {
        console.log('Tables found:', tableList?.length || 0);
        console.log('Table names:', tableList?.map(t => t.table_name).join(', '));
      }
    } catch (e) {
      console.log('Exception listing tables:', e);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
// }

// Run the function
// checkSpecializedAnswers();