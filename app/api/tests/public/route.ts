import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/app/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // First, fetch all active tests
    const { data: tests, error: testsError } = await supabase
      .from("tests")
      .select(`
        id,
        title,
        description,
        time_limit,
        is_active,
        category_ids
      `)
      .eq('is_active', true)
      .order('id');

    if (testsError) {
      console.error("Error fetching tests:", testsError);
      return NextResponse.json(
        { error: 'Failed to fetch tests' },
        { status: 500 }
      );
    }

    // Get all unique category IDs from all tests
    const allCategoryIds = [...new Set(
      (tests || []).flatMap(test => test.category_ids || [])
    )];

    // Fetch all categories in one query
    let categoriesMap = new Map();
    if (allCategoryIds.length > 0) {
      const { data: allCategories } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", allCategoryIds);
      
      allCategories?.forEach(cat => {
        categoriesMap.set(cat.id, cat);
      });
    }

    // Get all test IDs
    const testIds = (tests || []).map(test => test.id);

    // Fetch question counts for all tests in one query
    const questionCounts = new Map();
    if (testIds.length > 0) {
      const { data: testQuestions } = await supabase
        .from("test_questions")
        .select("test_id")
        .in("test_id", testIds);
      
      // Count questions per test
      testQuestions?.forEach(tq => {
        questionCounts.set(tq.test_id, (questionCounts.get(tq.test_id) || 0) + 1);
      });
    }

    // Combine data
    const transformedTests = (tests || []).map(test => ({
      ...test,
      categories: (test.category_ids || [])
        .map(id => categoriesMap.get(id))
        .filter(Boolean),
      question_count: questionCounts.get(test.id) || 0
    }));

    return NextResponse.json(transformedTests);
  } catch (error) {
    console.error('Error in GET /api/tests/public:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}