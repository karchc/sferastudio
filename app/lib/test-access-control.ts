import { SupabaseClient } from '@supabase/supabase-js';

export type TestAccessStatus =
  | 'granted' // User has full access (free test or purchased)
  | 'locked'  // Test is paid and user hasn't purchased
  | 'auth_required' // User must be logged in

export interface TestAccessResult {
  status: TestAccessStatus;
  canAccess: boolean;
  reason: string;
  testPrice?: number;
  testCurrency?: string;
  hasPurchased?: boolean;
  isFree?: boolean;
}

export interface TestAccessInfo {
  id: string;
  price?: number;
  currency?: string;
  is_free?: boolean;
}

/**
 * Checks if a user is an admin
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns true if user is an admin
 */
async function checkIsAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    // First check app_metadata from the auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.is_admin === true) {
      return true;
    }

    // If not in app metadata, check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    return profile?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Checks if a user has access to a specific test
 * @param supabase - Supabase client instance
 * @param userId - User ID (null if not authenticated)
 * @param testInfo - Test information including pricing
 * @returns TestAccessResult with access status and details
 */
export async function checkTestAccess(
  supabase: SupabaseClient,
  userId: string | null,
  testInfo: TestAccessInfo
): Promise<TestAccessResult> {
  const testPrice = testInfo.price || 0;
  const isFree = testInfo.is_free !== false && testPrice === 0;

  // If test is free, grant access to everyone (even non-authenticated users)
  if (isFree) {
    return {
      status: 'granted',
      canAccess: true,
      reason: 'Test is free and available to all users',
      isFree: true,
      testPrice: 0,
      testCurrency: testInfo.currency || 'USD',
    };
  }

  // For paid tests, user must be authenticated
  if (!userId) {
    return {
      status: 'auth_required',
      canAccess: false,
      reason: 'Authentication required to access this paid test',
      isFree: false,
      testPrice,
      testCurrency: testInfo.currency || 'USD',
    };
  }

  // Check if user is an admin - admins have access to all tests
  const isAdmin = await checkIsAdmin(supabase, userId);
  if (isAdmin) {
    return {
      status: 'granted',
      canAccess: true,
      reason: 'Admin access - full access to all tests',
      isFree: false,
      testPrice,
      testCurrency: testInfo.currency || 'USD',
      hasPurchased: true, // Treat admin as having purchased for UI purposes
    };
  }

  // Check if user has purchased the test
  try {
    const { data: purchase, error } = await supabase
      .from('user_test_purchases')
      .select('id, status')
      .eq('user_id', userId)
      .eq('test_id', testInfo.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error checking test purchase:', error);
      // On error, deny access for security
      return {
        status: 'locked',
        canAccess: false,
        reason: 'Unable to verify purchase status',
        isFree: false,
        testPrice,
        testCurrency: testInfo.currency || 'USD',
        hasPurchased: false,
      };
    }

    if (purchase) {
      return {
        status: 'granted',
        canAccess: true,
        reason: 'User has purchased this test',
        isFree: false,
        testPrice,
        testCurrency: testInfo.currency || 'USD',
        hasPurchased: true,
      };
    }

    // User hasn't purchased the test
    return {
      status: 'locked',
      canAccess: false,
      reason: 'Test requires purchase',
      isFree: false,
      testPrice,
      testCurrency: testInfo.currency || 'USD',
      hasPurchased: false,
    };
  } catch (error) {
    console.error('Unexpected error in checkTestAccess:', error);
    return {
      status: 'locked',
      canAccess: false,
      reason: 'Error checking access',
      isFree: false,
      testPrice,
      testCurrency: testInfo.currency || 'USD',
      hasPurchased: false,
    };
  }
}

/**
 * Server-side helper to check test access using server Supabase client
 * @param supabase - Server Supabase client
 * @param testId - Test ID to check access for
 * @returns TestAccessResult with access status
 */
export async function checkTestAccessServer(
  supabase: SupabaseClient,
  testId: string
): Promise<TestAccessResult> {
  // Get current user from server session
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // Fetch test pricing information
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('id, price, currency, is_free')
    .eq('id', testId)
    .single();

  if (testError || !test) {
    return {
      status: 'locked',
      canAccess: false,
      reason: 'Test not found',
    };
  }

  return checkTestAccess(supabase, userId, test);
}

/**
 * Batch check access for multiple tests (useful for dashboard)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param tests - Array of test information
 * @returns Map of test IDs to access results
 */
export async function checkMultipleTestsAccess(
  supabase: SupabaseClient,
  userId: string | null,
  tests: TestAccessInfo[]
): Promise<Map<string, TestAccessResult>> {
  const results = new Map<string, TestAccessResult>();

  // For free tests, no need to check purchases
  const freeTests = tests.filter(t => {
    const isFree = t.is_free !== false && (!t.price || t.price === 0);
    if (isFree) {
      results.set(t.id, {
        status: 'granted',
        canAccess: true,
        reason: 'Test is free',
        isFree: true,
        testPrice: 0,
        testCurrency: t.currency || 'USD',
      });
    }
    return !isFree;
  });

  // If no paid tests or user not authenticated, return early
  if (freeTests.length === 0 || !userId) {
    // Mark remaining tests as requiring auth or locked
    tests.forEach(t => {
      if (!results.has(t.id)) {
        results.set(t.id, {
          status: userId ? 'locked' : 'auth_required',
          canAccess: false,
          reason: userId ? 'Test requires purchase' : 'Authentication required',
          isFree: false,
          testPrice: t.price || 0,
          testCurrency: t.currency || 'USD',
          hasPurchased: false,
        });
      }
    });
    return results;
  }

  // Batch fetch all purchases for paid tests
  const paidTestIds = tests
    .filter(t => !results.has(t.id))
    .map(t => t.id);

  if (paidTestIds.length > 0) {
    const { data: purchases } = await supabase
      .from('user_test_purchases')
      .select('test_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('test_id', paidTestIds);

    const purchasedTestIds = new Set(purchases?.map(p => p.test_id) || []);

    // Set results for all paid tests
    tests.forEach(test => {
      if (!results.has(test.id)) {
        const hasPurchased = purchasedTestIds.has(test.id);
        results.set(test.id, {
          status: hasPurchased ? 'granted' : 'locked',
          canAccess: hasPurchased,
          reason: hasPurchased ? 'User has purchased this test' : 'Test requires purchase',
          isFree: false,
          testPrice: test.price || 0,
          testCurrency: test.currency || 'USD',
          hasPurchased,
        });
      }
    });
  }

  return results;
}
