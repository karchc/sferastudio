import { NextResponse } from 'next/server';
import { syncFeaturedTestsToWebflow, syncCategoriesToWebflow, isWebflowConfigured } from '@/app/lib/webflow-sync';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

interface Category {
  id: string;
  name: string;
}

/**
 * GET /api/admin/sync-webflow
 * Check if Webflow sync is configured
 */
export async function GET() {
  const configured = isWebflowConfigured();

  return NextResponse.json({
    configured,
    message: configured
      ? 'Webflow sync is configured and ready'
      : 'Webflow sync is not configured. Please set WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, and WEBFLOW_COLLECTION_ID environment variables.',
  });
}

/**
 * POST /api/admin/sync-webflow
 * Sync featured tests to Webflow CMS collection
 */
export async function POST() {
  try {
    // Check if Webflow is configured
    if (!isWebflowConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webflow sync is not configured',
          message: 'Please set WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, and WEBFLOW_COLLECTION_ID environment variables.',
        },
        { status: 400 }
      );
    }

    // Fetch featured tests from Supabase (including category_ids)
    const testsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/tests?feature=eq.true&is_archived=eq.false&select=id,title,description,time_limit,price,category_ids`,
      { headers }
    );

    if (!testsResponse.ok) {
      const error = await testsResponse.text();
      throw new Error(`Failed to fetch featured tests: ${error}`);
    }

    const tests = await testsResponse.json();

    // Collect all unique category IDs from featured tests
    const allCategoryIds = new Set<string>();
    for (const test of tests) {
      if (test.category_ids && Array.isArray(test.category_ids)) {
        for (const catId of test.category_ids) {
          allCategoryIds.add(catId);
        }
      }
    }

    // Fetch category details from Supabase
    let categories: Category[] = [];
    if (allCategoryIds.size > 0) {
      const categoryIds = Array.from(allCategoryIds).join(',');
      const categoriesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/categories?id=in.(${categoryIds})&select=id,name`,
        { headers }
      );
      if (categoriesResponse.ok) {
        categories = await categoriesResponse.json();
      }
    }

    // Sync categories to Webflow first and get the mapping
    const categoryMap = await syncCategoriesToWebflow(categories);

    // Create a lookup map for category details
    const categoryLookup = new Map<string, Category>();
    for (const cat of categories) {
      categoryLookup.set(cat.id, cat);
    }

    // Get question counts and category details for each test
    const testsWithDetails = await Promise.all(
      tests.map(async (test: { id: string; category_ids?: string[] }) => {
        // Get question count
        const countResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/test_questions?test_id=eq.${test.id}&select=id`,
          { headers }
        );
        const questions = countResponse.ok ? await countResponse.json() : [];

        // Get category details for this test
        const testCategories: Category[] = [];
        if (test.category_ids && Array.isArray(test.category_ids)) {
          for (const catId of test.category_ids) {
            const cat = categoryLookup.get(catId);
            if (cat) {
              testCategories.push(cat);
            }
          }
        }

        return {
          ...test,
          question_count: questions.length,
          categories: testCategories,
        };
      })
    );

    // Sync to Webflow with category mapping
    const result = await syncFeaturedTestsToWebflow(testsWithDetails, categoryMap);

    return NextResponse.json({
      ...result,
      message: result.success
        ? `Sync completed successfully: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`
        : 'Sync completed with errors',
    });
  } catch (error) {
    console.error('Error syncing to Webflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync to Webflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
