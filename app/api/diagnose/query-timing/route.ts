import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Time each step of the query process
const timeStep = async (name: string, fn: () => Promise<any>) => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    return { 
      name, 
      success: true, 
      duration, 
      result,
      error: null
    };
  } catch (error: any) {
    const duration = Date.now() - start;
    return { 
      name, 
      success: false, 
      duration, 
      result: null,
      error: error.message || String(error)
    };
  }
};

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gezlcxtprkcceizadvre.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const results = [];
  
  // Step 1: Test simple connection
  results.push(await timeStep('connection_test', async () => {
    const { data } = await supabase.from('tests').select('count').limit(1);
    return data;
  }));
  
  // Step 2: Fetch test data
  results.push(await timeStep('fetch_test', async () => {
    const { data, error } = await supabase
      .from('tests')
      .select('*, categories(*)')
      .eq('id', testId)
      .single();
    
    if (error) throw error;
    return data;
  }));
  
  // Step 3: Fetch test questions
  const questionsResult = await timeStep('fetch_questions', async () => {
    const { data, error } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId)
      .order('position', { ascending: true });
    
    if (error) throw error;
    return data;
  });
  
  results.push(questionsResult);
  
  // Step 4: Fetch answers for each question type
  if (questionsResult.success && questionsResult.result) {
    const questions = questionsResult.result;
    
    // Try batch fetching all answers at once - create a list of questionIds
    const questionIds = questions.map((q: any) => q.questions?.id).filter(Boolean);
    
    if (questionIds.length > 0) {
      // Step 4.1: Batch fetch choice answers
      results.push(await timeStep('fetch_choice_answers_batch', async () => {
        const { data, error } = await supabase
          .from('answers')
          .select('*')
          .in('question_id', questionIds);
        
        if (error) throw error;
        return data;
      }));
      
      // Step 4.2: Batch fetch match items
      results.push(await timeStep('fetch_match_items_batch', async () => {
        const { data, error } = await supabase
          .from('match_items')
          .select('*')
          .in('question_id', questionIds);
        
        if (error) throw error;
        return data;
      }));
      
      // Step 4.3: Batch fetch sequence items
      results.push(await timeStep('fetch_sequence_items_batch', async () => {
        const { data, error } = await supabase
          .from('sequence_items')
          .select('*')
          .in('question_id', questionIds);
        
        if (error) throw error;
        return data;
      }));
      
      // Step 4.4: Batch fetch drag drop items
      results.push(await timeStep('fetch_drag_drop_items_batch', async () => {
        const { data, error } = await supabase
          .from('drag_drop_items')
          .select('*')
          .in('question_id', questionIds);
        
        if (error) throw error;
        return data;
      }));
    }
    
    // Individual question timing (this is likely what's causing the timeout)
    // Only test first 2 questions to avoid timeouts
    for (let i = 0; i < Math.min(2, questions.length); i++) {
      const question = questions[i].questions;
      if (!question) continue;
      
      results.push(await timeStep(`fetch_answers_q${i+1}_${question.type}`, async () => {
        switch (question.type) {
          case 'multiple-choice':
          case 'single-choice':
          case 'true-false':
            const { data, error } = await supabase
              .from('answers')
              .select('*')
              .eq('question_id', question.id);
            
            if (error) throw error;
            return data;
            
          case 'matching':
            const { data: matchData, error: matchError } = await supabase
              .from('match_items')
              .select('*')
              .eq('question_id', question.id);
            
            if (matchError) throw matchError;
            return matchData;
            
          case 'sequence':
            const { data: sequenceData, error: sequenceError } = await supabase
              .from('sequence_items')
              .select('*')
              .eq('question_id', question.id)
              .order('correct_position', { ascending: true });
            
            if (sequenceError) throw sequenceError;
            return sequenceData;
            
          case 'drag-drop':
            const { data: dragDropData, error: dragDropError } = await supabase
              .from('drag_drop_items')
              .select('*')
              .eq('question_id', question.id);
            
            if (dragDropError) throw dragDropError;
            return dragDropData;
            
          default:
            return [];
        }
      }));
    }
  }
  
  // Calculate total time
  const totalTime = results.reduce((sum, result) => sum + result.duration, 0);
  
  // Summary of results
  const summary = {
    totalTime,
    steps: results.map(r => ({
      name: r.name,
      success: r.success,
      duration: r.duration,
      resultCount: r.result ? (Array.isArray(r.result) ? r.result.length : 1) : 0,
      error: r.error
    })),
    slowestQuery: results.sort((a, b) => b.duration - a.duration)[0]?.name
  };
  
  return NextResponse.json({
    summary,
    details: results
  });
}