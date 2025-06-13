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
    const { categories, ...testData } = body;
    
    // First, create the test
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...testData,
        is_archived: false,
        created_at: new Date().toISOString()
      })
    });
    
    if (!testResponse.ok) {
      throw new Error('Failed to create test');
    }
    
    const [newTest] = await testResponse.json();
    
    // If categories are provided, create them
    if (categories && categories.length > 0) {
      const createdCategoryIds: string[] = [];
      
      // Create categories one by one to handle potential schema differences
      for (const cat of categories) {
        const categoryData: any = {
          name: cat.name,
          description: cat.description || null
        };
        
        // Try to add test_id if the column exists
        try {
          categoryData.test_id = newTest.id;
        } catch (e) {
          // If test_id column doesn't exist, we'll still create the category
          console.log('Creating category without test_id (column may not exist yet)');
        }
        
        const categoryResponse = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(categoryData)
        });
        
        if (!categoryResponse.ok) {
          const errorText = await categoryResponse.text();
          console.error('Failed to create category:', errorText);
          
          // If the error is about test_id column, try without it
          if (errorText.includes('test_id') || errorText.includes('column')) {
            const fallbackData = {
              name: cat.name,
              description: cat.description || null
            };
            
            const fallbackResponse = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
              method: 'POST',
              headers: {
                ...headers,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(fallbackData)
            });
            
            if (fallbackResponse.ok) {
              const [newCategory] = await fallbackResponse.json();
              createdCategoryIds.push(newCategory.id);
              console.log('Created category without test_id:', newCategory);
            } else {
              console.error('Failed to create category even without test_id');
            }
          }
        } else {
          const [newCategory] = await categoryResponse.json();
          createdCategoryIds.push(newCategory.id);
          console.log('Created category with test_id:', newCategory);
        }
      }
      
      // Update test with category IDs
      if (createdCategoryIds.length > 0) {
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${newTest.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ category_ids: createdCategoryIds })
        });
        
        if (!updateResponse.ok) {
          const updateError = await updateResponse.text();
          console.error('Failed to update test with category IDs:', updateError);
        } else {
          console.log('Updated test with category IDs:', createdCategoryIds);
        }
      }
    }
    
    return NextResponse.json(newTest);
  } catch (error) {
    console.error('Error in POST /api/admin/tests:', error);
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}