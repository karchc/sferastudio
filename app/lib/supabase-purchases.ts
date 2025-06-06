import { createClientSupabase } from './auth-client';

export type TestPurchase = {
  id: string;
  user_id: string;
  test_id: string;
  purchase_date: string;
  payment_amount: number;
  payment_method?: string;
  transaction_id?: string;
  status: 'active' | 'refunded' | 'expired';
};

export type PurchaseTest = {
  test_id: string;
  payment_amount: number;
  payment_method?: string;
  transaction_id?: string;
};

/**
 * Creates a new test purchase record for a user
 */
export async function createTestPurchase(
  userId: string, 
  purchaseData: PurchaseTest
): Promise<{ data: TestPurchase | null; error: string | null }> {
  const supabase = createClientSupabase();
  
  try {
    const { data, error } = await supabase
      .from('user_test_purchases')
      .insert({
        user_id: userId,
        test_id: purchaseData.test_id,
        payment_amount: purchaseData.payment_amount,
        payment_method: purchaseData.payment_method,
        transaction_id: purchaseData.transaction_id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test purchase:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error creating test purchase:', error);
    return { data: null, error: 'Failed to create purchase record' };
  }
}

/**
 * Checks if a user has purchased a specific test
 */
export async function hasUserPurchasedTest(
  userId: string, 
  testId: string
): Promise<{ hasPurchased: boolean; error: string | null }> {
  const supabase = createClientSupabase();
  
  try {
    const { data, error } = await supabase
      .from('user_test_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking test purchase:', error);
      return { hasPurchased: false, error: error.message };
    }

    return { hasPurchased: !!data, error: null };
  } catch (error) {
    console.error('Unexpected error checking test purchase:', error);
    return { hasPurchased: false, error: 'Failed to check purchase status' };
  }
}

/**
 * Gets all purchases for a user with test details
 */
export async function getUserPurchases(userId: string): Promise<{
  data: Array<TestPurchase & { test: any }> | null;
  error: string | null;
}> {
  const supabase = createClientSupabase();
  
  try {
    const { data, error } = await supabase
      .from('user_test_purchases')
      .select(`
        *,
        tests:test_id (
          id,
          title,
          description,
          time_limit,
          price,
          currency,
          is_free,
          category_id,
          categories:category_id (
            name,
            description
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching user purchases:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching user purchases:', error);
    return { data: null, error: 'Failed to fetch purchases' };
  }
}

/**
 * Refunds a test purchase (marks as refunded)
 */
export async function refundTestPurchase(
  purchaseId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClientSupabase();
  
  try {
    const { error } = await supabase
      .from('user_test_purchases')
      .update({ 
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    if (error) {
      console.error('Error refunding test purchase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error refunding test purchase:', error);
    return { success: false, error: 'Failed to process refund' };
  }
}

/**
 * Gets purchase statistics for a user
 */
export async function getUserPurchaseStats(userId: string): Promise<{
  data: {
    totalPurchased: number;
    totalSpent: number;
    mostRecentPurchase: string | null;
  } | null;
  error: string | null;
}> {
  const supabase = createClientSupabase();
  
  try {
    const { data, error } = await supabase
      .from('user_test_purchases')
      .select('payment_amount, purchase_date')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching purchase stats:', error);
      return { data: null, error: error.message };
    }

    const totalPurchased = data?.length || 0;
    const totalSpent = data?.reduce((sum, purchase) => sum + (purchase.payment_amount || 0), 0) || 0;
    const mostRecentPurchase = data && data.length > 0 
      ? data.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())[0].purchase_date
      : null;

    return {
      data: {
        totalPurchased,
        totalSpent,
        mostRecentPurchase
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error fetching purchase stats:', error);
    return { data: null, error: 'Failed to fetch purchase statistics' };
  }
}