import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function GET() {
  try {
    // Fetch tests with category information and question counts
    const testsRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?select=*&is_archived=eq.false&order=created_at.desc`, {
      headers
    });

    if (!testsRes.ok) {
      throw new Error(`Failed to fetch tests: ${testsRes.status}`);
    }

    const testsData = await testsRes.json();
    
    // For each test, fetch associated categories and question count
    const testsWithDetails = await Promise.all(
      testsData.map(async (test: any) => {
        let categories = [];
        let questionCount = 0;
        
        // Fetch categories for this test
        if (test.category_ids && test.category_ids.length > 0) {
          const categoryIds = test.category_ids.join(',');
          const categoriesRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name&id=in.(${categoryIds})`, {
            headers
          });
          
          if (categoriesRes.ok) {
            categories = await categoriesRes.json();
          }
        }
        
        // Fetch question count for this test
        const questionsRes = await fetch(`${SUPABASE_URL}/rest/v1/test_questions?select=id&test_id=eq.${test.id}`, {
          headers
        });
        
        if (questionsRes.ok) {
          const questions = await questionsRes.json();
          questionCount = questions.length;
        }
        
        return {
          ...test,
          categories,
          question_count: questionCount
        };
      })
    );
    
    return NextResponse.json(testsWithDetails);
  } catch (error) {
    console.error('Error in GET /api/admin/tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...body,
        is_archived: false,
        created_at: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create test');
    }
    
    const [newTest] = await response.json();
    return NextResponse.json(newTest);
  } catch (error) {
    console.error('Error in POST /api/admin/tests:', error);
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}