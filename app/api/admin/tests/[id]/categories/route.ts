import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const { categoryId, action } = await request.json();
    
    // Get current test
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}&select=category_ids`, {
      headers
    });
    
    if (!testRes.ok) throw new Error('Failed to fetch test');
    const [test] = await testRes.json();
    if (!test) throw new Error('Test not found');
    
    let updatedCategoryIds = test.category_ids || [];
    
    if (action === 'add') {
      if (!updatedCategoryIds.includes(categoryId)) {
        updatedCategoryIds = [...updatedCategoryIds, categoryId];
      }
    } else if (action === 'remove') {
      // Remove all questions from this category from the test first
      await fetch(`${SUPABASE_URL}/rest/v1/test_questions?test_id=eq.${testId}&question.category_id=eq.${categoryId}`, {
        method: 'DELETE',
        headers
      });
      
      updatedCategoryIds = updatedCategoryIds.filter((id: string) => id !== categoryId);
    }
    
    // Update test with new category IDs
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ category_ids: updatedCategoryIds })
    });
    
    if (!updateRes.ok) throw new Error(`Failed to ${action} category`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in POST /api/admin/tests/[id]/categories:`, error);
    return NextResponse.json(
      { error: `Failed to manage category` },
      { status: 500 }
    );
  }
}