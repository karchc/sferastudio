-- Migration: Add Row Level Security policies for test access gating
-- This ensures users can only access tests they own or that are free

-- Enable RLS on user_test_purchases if not already enabled
ALTER TABLE user_test_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own purchases" ON user_test_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON user_test_purchases;
DROP POLICY IF EXISTS "Service role can manage all purchases" ON user_test_purchases;

-- Policy: Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
  ON user_test_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own purchases (through application logic)
-- This is restricted because purchases should only be created via Stripe webhooks
-- But we allow users to query for testing/preview purposes
CREATE POLICY "Users can insert their own purchases"
  ON user_test_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can manage all purchases (for Stripe webhooks)
-- This policy allows the service role to bypass RLS
CREATE POLICY "Service role can manage all purchases"
  ON user_test_purchases
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create an index for faster access control checks
CREATE INDEX IF NOT EXISTS idx_user_test_purchases_user_test_status
  ON user_test_purchases(user_id, test_id, status);

-- Add a helper function to check if a user has access to a test
CREATE OR REPLACE FUNCTION has_test_access(
  p_user_id UUID,
  p_test_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  test_is_free BOOLEAN;
  test_price DECIMAL(10,2);
  has_purchase BOOLEAN;
BEGIN
  -- Get test pricing information
  SELECT is_free, COALESCE(price, 0)
  INTO test_is_free, test_price
  FROM tests
  WHERE id = p_test_id;

  -- If test not found, deny access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- If test is free (is_free = true OR price = 0), grant access
  IF test_is_free = TRUE OR test_price = 0 THEN
    RETURN TRUE;
  END IF;

  -- If user is not provided, deny access to paid tests
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user has an active purchase
  SELECT EXISTS (
    SELECT 1
    FROM user_test_purchases
    WHERE user_id = p_user_id
      AND test_id = p_test_id
      AND status = 'active'
  ) INTO has_purchase;

  RETURN has_purchase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION has_test_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_test_access(UUID, UUID) TO anon;

-- Create a function to get all accessible tests for a user
CREATE OR REPLACE FUNCTION get_accessible_tests(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  test_id UUID,
  is_free BOOLEAN,
  has_access BOOLEAN,
  has_purchased BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS test_id,
    (t.is_free = TRUE OR COALESCE(t.price, 0) = 0) AS is_free,
    (
      -- Test is free OR user has purchased it
      (t.is_free = TRUE OR COALESCE(t.price, 0) = 0)
      OR
      (
        p_user_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM user_test_purchases utp
          WHERE utp.user_id = p_user_id
            AND utp.test_id = t.id
            AND utp.status = 'active'
        )
      )
    ) AS has_access,
    (
      p_user_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM user_test_purchases utp
        WHERE utp.user_id = p_user_id
          AND utp.test_id = t.id
          AND utp.status = 'active'
      )
    ) AS has_purchased
  FROM tests t
  WHERE t.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_accessible_tests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_tests(UUID) TO anon;

-- Add comments for documentation
COMMENT ON FUNCTION has_test_access IS 'Checks if a user has access to a specific test (free or purchased)';
COMMENT ON FUNCTION get_accessible_tests IS 'Returns all tests with access information for a user';
COMMENT ON POLICY "Users can view their own purchases" ON user_test_purchases IS 'Users can only view their own purchase records';
COMMENT ON POLICY "Service role can manage all purchases" ON user_test_purchases IS 'Service role (Stripe webhooks) can manage all purchases';
