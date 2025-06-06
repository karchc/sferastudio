import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    
    // Load test details
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}&select=*`, {
      headers
    });
    
    if (!testRes.ok) throw new Error('Failed to load test');
    const [testData] = await testRes.json();
    if (!testData) throw new Error('Test not found');
    
    // Load all categories
    const categoriesRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&is_archived=eq.false&order=name.asc`, {
      headers
    });
    
    if (!categoriesRes.ok) throw new Error('Failed to load categories');
    const allCategoriesData = await categoriesRes.json();
    
    // Load categories associated with this test
    const testCategories = testData.category_ids ? 
      allCategoriesData.filter((cat: any) => testData.category_ids.includes(cat.id)) : 
      [];
    
    // For each category, load questions that are assigned to this test
    const categoriesWithQuestions = await Promise.all(
      testCategories.map(async (category: any) => {
        try {
          // First get test_questions for this test and category
          const testQuestionsRes = await fetch(
            `${SUPABASE_URL}/rest/v1/test_questions?select=question_id,position&test_id=eq.${testId}`,
            { headers }
          );
          
          let questions = [];
          if (testQuestionsRes.ok) {
            const testQuestionIds = await testQuestionsRes.json();
            
            if (testQuestionIds.length > 0) {
              // Get actual questions for this category
              const questionIds = testQuestionIds.map((tq: any) => tq.question_id).join(',');
              const questionsRes = await fetch(
                `${SUPABASE_URL}/rest/v1/questions?select=*&id=in.(${questionIds})&category_id=eq.${category.id}`,
                { headers }
              );
              
              if (questionsRes.ok) {
                const questionsData = await questionsRes.json();
                questions = questionsData.map((q: any) => {
                  const testQuestion = testQuestionIds.find((tq: any) => tq.question_id === q.id);
                  return {
                    ...q,
                    position: testQuestion?.position || 0
                  };
                }).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
              }
            }
          }
          
          return {
            ...category,
            questions,
            question_count: questions.length
          };
        } catch (err) {
          console.error(`Error loading questions for category ${category.id}:`, err);
          return {
            ...category,
            questions: [],
            question_count: 0
          };
        }
      })
    );
    
    return NextResponse.json({
      test: testData,
      categories: categoriesWithQuestions,
      allCategories: allCategoriesData
    });
  } catch (error) {
    console.error('Error in GET /api/admin/tests/[id]:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to fetch test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const body = await request.json();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) throw new Error('Failed to update test');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/tests/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to delete test');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/tests/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete test' },
      { status: 500 }
    );
  }
}