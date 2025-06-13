import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Simple in-memory cache for categories
let cachedCategories: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedCategories, {
        headers: {
          'Cache-Control': 'public, max-age=300' // 5 minutes
        }
      });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=*&order=name.asc`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const data = await response.json();
    
    // Update cache
    cachedCategories = data || [];
    cacheTimestamp = now;
    
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create category');
    }
    
    const [newCategory] = await response.json();
    
    // Invalidate cache when new category is created
    cachedCategories = null;
    cacheTimestamp = 0;
    
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Error in POST /api/admin/categories:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}