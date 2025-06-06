-- User test purchases table to track which tests users have purchased
CREATE TABLE user_test_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_amount DECIMAL(10,2), -- Store the amount paid for the test
  payment_method TEXT, -- e.g., 'stripe', 'paypal', etc.
  transaction_id TEXT, -- External payment processor transaction ID
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'refunded', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, test_id) -- Prevent duplicate purchases for the same test
);

-- Create indexes for performance
CREATE INDEX idx_user_test_purchases_user_id ON user_test_purchases(user_id);
CREATE INDEX idx_user_test_purchases_test_id ON user_test_purchases(test_id);
CREATE INDEX idx_user_test_purchases_status ON user_test_purchases(status);
CREATE INDEX idx_user_test_purchases_purchase_date ON user_test_purchases(purchase_date);

-- Add pricing information to the tests table
ALTER TABLE tests ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE tests ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE tests ADD COLUMN is_free BOOLEAN DEFAULT true;

-- Update existing tests to be free for backward compatibility
UPDATE tests SET is_free = true, price = 0.00 WHERE price IS NULL;