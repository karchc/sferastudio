import { NextRequest, NextResponse } from 'next/server';
import { createDirectSupabase } from '@/app/lib/direct-supabase';
import { getHardcodedTestData, getHardcodedQuestions } from '@/app/lib/test-debugger-utils';

/**
 * Special debug API that ensures bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb always works
 * This is used for the test debugger page to ensure it can always fetch a test and questions
 * for development and debugging purposes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId') || 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const includeQuestions = searchParams.get('includeQuestions') === 'true';
  const includeAnswers = searchParams.get('includeAnswers') === 'true';
  const limit = parseInt(searchParams.get('limit') || '0', 10);
  
  try {
    // Special case for listing all tests
    if (testId === 'list') {
      console.log('Fetching list of tests for debug endpoint');
      
      // Always include our hardcoded test
      const hardcodedTest = {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'JavaScript Basics (Hardcoded)'
      };
      
      try {
        // Try to get actual tests from database
        const supabase = createDirectSupabase();
        const { data, error } = await supabase
          .from('tests')
          .select('id, title')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching tests list:', error);
          // Return just the hardcoded test if database query fails
          return NextResponse.json({
            success: true,
            tests: [hardcodedTest],
            message: 'Returning hardcoded test only due to database error'
          });
        }
        
        if (data && data.length > 0) {
          // Add hardcoded test to the list
          const hasHardcodedTest = data.some(t => t.id === hardcodedTest.id);
          if (!hasHardcodedTest) {
            data.unshift(hardcodedTest);
          }
          
          return NextResponse.json({
            success: true,
            tests: data,
            message: 'Successfully fetched tests list'
          });
        } else {
          // No tests found, return just the hardcoded test
          return NextResponse.json({
            success: true,
            tests: [hardcodedTest],
            message: 'No tests found in database, returning hardcoded test only'
          });
        }
      } catch (error) {
        console.error('Exception fetching tests list:', error);
        // Return just the hardcoded test if an exception occurs
        return NextResponse.json({
          success: true,
          tests: [hardcodedTest],
          message: 'Returning hardcoded test only due to exception'
        });
      }
    }
    
    // Always check if we have hardcoded data first
    if (testId === 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') {
      console.log('Using hardcoded data for JavaScript Basics test');
      
      const hardcodedTest = getHardcodedTestData(testId);
      
      if (!hardcodedTest) {
        return NextResponse.json(
          { success: false, message: 'No hardcoded test data available' },
          { status: 500 }
        );
      }
      
      let questions: any[] = [];
      
      if (includeQuestions) {
        questions = getHardcodedQuestions(testId);
        
        // Log what questions we're using
        console.log(`Using ${questions.length} hardcoded questions for JavaScript Basics test`);
        
        // Remove answers if not requested
        if (!includeAnswers) {
          questions = questions.map(q => ({ ...q, answers: [] }));
        }
      }
      
      return NextResponse.json({
        success: true,
        test: hardcodedTest,
        questions: includeQuestions ? questions : [],
        message: 'Loaded hardcoded test data successfully',
        source: 'hardcoded'
      });
    }
    
    // For other test IDs, try to fetch from Supabase
    console.log(`Fetching test data for ID: ${testId}`);
    const supabase = createDirectSupabase();
    
    // Fetch test data
    const { data: testData, error: testError } = await supabase
      .from('tests')
      .select('*, categories(*)')
      .eq('id', testId)
      .single();
      
    if (testError) {
      return NextResponse.json(
        { success: false, error: testError, message: 'Error fetching test data' },
        { status: 500 }
      );
    }
    
    if (!includeQuestions) {
      return NextResponse.json({
        success: true,
        test: testData,
        message: 'Loaded test data successfully (without questions)'
      });
    }
    
    // Fetch questions if requested
    const { data: questionsData, error: questionsError } = await supabase
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId)
      .order('position', { ascending: true });
      
    if (questionsError) {
      return NextResponse.json(
        { success: false, error: questionsError, message: 'Error fetching questions' },
        { status: 500 }
      );
    }
    
    // Process questions data
    let processedQuestions = questionsData.map(q => ({
      id: q.question_id,
      text: q.questions?.text || "Question text unavailable",
      type: q.questions?.type || "unknown",
      position: q.position || 0,
      categoryId: q.questions?.category_id,
      answers: [] // Empty answers array
    }));
    
    // Apply limit if specified
    if (limit > 0 && processedQuestions.length > limit) {
      console.log(`Limiting questions from ${processedQuestions.length} to ${limit}`);
      processedQuestions = processedQuestions.slice(0, limit);
    }
    
    // Fetch answers if requested
    if (includeAnswers && processedQuestions.length > 0) {
      console.log(`Fetching answers for ${processedQuestions.length} questions`);
      
      const answersMap: {[id: string]: any[]} = {};
      
      // Skip SQL query approach and go directly to standard table-specific queries
      // Group question IDs by type for querying
      const questionIds = processedQuestions.map(q => q.id);
      const questionTypes: {[id: string]: string} = {};
      
      // Map question IDs to their types
      processedQuestions.forEach(q => {
        questionTypes[q.id] = q.type;
      });
      
      // Group question IDs by type
      const multipleChoiceIds = questionIds.filter(id => 
        ['multiple-choice', 'single-choice', 'true-false'].includes(questionTypes[id])
      );
      const matchingIds = questionIds.filter(id => questionTypes[id] === 'matching');
      const sequenceIds = questionIds.filter(id => questionTypes[id] === 'sequence');
      const dragDropIds = questionIds.filter(id => questionTypes[id] === 'drag-drop');
      
      // Run queries in parallel
      const promises = [];
        
      // Fetch multiple-choice, single-choice, and true-false answers
      if (multipleChoiceIds.length > 0) {
        console.log(`Fetching standard answers for ${multipleChoiceIds.length} choice questions`);
        promises.push(
          supabase
            .from('answers')
            .select('*')
            .in('question_id', multipleChoiceIds)
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                // Group by question_id
                data.forEach(answer => {
                  if (!answersMap[answer.question_id]) {
                    answersMap[answer.question_id] = [];
                  }
                  answersMap[answer.question_id].push(answer);
                });
              }
            })
        );
      }
      
      // Fetch matching answers
      if (matchingIds.length > 0) {
        console.log(`Fetching matching answers for ${matchingIds.length} questions`);
        promises.push(
          supabase
            .from('match_items')
            .select('*')
            .in('question_id', matchingIds)
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                // Group by question_id
                data.forEach(item => {
                  if (!answersMap[item.question_id]) {
                    answersMap[item.question_id] = [];
                  }
                  answersMap[item.question_id].push(item);
                });
              }
            })
        );
      }
      
      // Fetch sequence answers
      if (sequenceIds.length > 0) {
        console.log(`Fetching sequence answers for ${sequenceIds.length} questions`);
        promises.push(
          supabase
            .from('sequence_items')
            .select('*')
            .in('question_id', sequenceIds)
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                // Group by question_id
                data.forEach(item => {
                  if (!answersMap[item.question_id]) {
                    answersMap[item.question_id] = [];
                  }
                  answersMap[item.question_id].push(item);
                });
              }
            })
        );
      }
      
      // Fetch drag-drop answers
      if (dragDropIds.length > 0) {
        console.log(`Fetching drag-drop answers for ${dragDropIds.length} questions`);
        promises.push(
          supabase
            .from('drag_drop_items')
            .select('*')
            .in('question_id', dragDropIds)
            .then(({ data, error }) => {
              if (!error && data && data.length > 0) {
                // Group by question_id
                data.forEach(item => {
                  if (!answersMap[item.question_id]) {
                    answersMap[item.question_id] = [];
                  }
                  answersMap[item.question_id].push(item);
                });
              }
            })
        );
      }
      
      // Wait for all queries to complete with timeout protection
      await Promise.race([
        Promise.all(promises),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Answers fetch timeout')), 10000))
      ]).catch(error => {
        console.warn('Some answer fetching timed out:', error);
      });
      
      // Apply answers to questions
      processedQuestions.forEach(question => {
        (question as any).answers = answersMap[question.id] || [];
      });
      
      // Calculate stats for the log message
      const totalAnswers = Object.values(answersMap).reduce((sum, arr) => sum + arr.length, 0);
      const questionsWithAnswers = Object.keys(answersMap).length;
      const questionsWithoutAnswers = processedQuestions.length - questionsWithAnswers;
      
      let message = 'Loaded test data, questions, and answers successfully';
      if (questionsWithoutAnswers > 0) {
        message += ` (${questionsWithAnswers}/${processedQuestions.length} questions have answers)`;
      }
      
      // Return the answers map for direct use by the client
      return NextResponse.json({
        success: true,
        test: testData,
        questions: processedQuestions,
        answers: answersMap,
        stats: {
          totalQuestions: processedQuestions.length,
          questionsWithAnswers,
          questionsWithoutAnswers,
          totalAnswers
        },
        message
      });
    }
    
    return NextResponse.json({
      success: true,
      test: testData,
      questions: processedQuestions,
      message: 'Loaded test data and questions successfully (without answers)'
    });
  } catch (error) {
    console.error('Error in test-debug API:', error);
    return NextResponse.json(
      { success: false, error, message: 'Unexpected error in test-debug API' },
      { status: 500 }
    );
  }
}