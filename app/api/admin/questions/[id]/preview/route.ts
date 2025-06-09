import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const { is_preview } = await request.json();
    
    if (typeof is_preview !== 'boolean') {
      return NextResponse.json(
        { error: 'is_preview must be a boolean value' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_preview })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update question preview status');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/questions/[id]/preview:', error);
    return NextResponse.json(
      { error: 'Failed to update question preview status' },
      { status: 500 }
    );
  }
}