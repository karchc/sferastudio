# Test Access Gating Implementation Guide

## Overview

This document describes the complete test access gating system that has been implemented to control access to paid and free tests in the Practice ERP platform.

## 🎯 Implementation Summary

### What Was Built

1. **Access Control Utility** (`/app/lib/test-access-control.ts`)
   - Centralized function to check test access permissions
   - Supports free tests, paid tests, and authentication requirements
   - Batch checking capability for dashboard views
   - Returns detailed access status with reasons

2. **Database RLS Policies** (`/supabase/migrations/20251118_001_test_access_rls.sql`)
   - Row-Level Security for `user_test_purchases` table
   - Helper functions for access checks
   - Service role policies for Stripe webhooks
   - Performance indexes for faster queries

3. **Updated Test API** (`/app/api/test/[id]/route.ts`)
   - Enforces access control before returning test data
   - Returns 401 for unauthenticated users trying to access paid tests
   - Returns 403 for authenticated users without purchase
   - Includes access information in successful responses

4. **Enhanced Test Page** (`/app/test/[id]/page.tsx`)
   - Handles locked test scenarios with beautiful UI
   - Shows authentication prompts for non-logged-in users
   - Displays purchase prompts for locked tests
   - Provides clear CTAs to purchase or sign in

5. **Dashboard Integration**
   - Already has lock indicators for premium tests
   - Displays purchase buttons for paid tests
   - Shows "OWNED" badges for purchased tests

## 🚀 How It Works

### Access Check Flow

```
User Requests Test → API Checks Access
    ↓
Is Test Free?
    Yes → Grant Access ✅
    No → Continue
    ↓
Is User Authenticated?
    No → Return 401 (Auth Required) 🔒
    Yes → Continue
    ↓
Has User Purchased Test?
    Yes → Grant Access ✅
    No → Return 403 (Purchase Required) 💳
```

### Access Status Types

1. **`granted`** - User has full access (free test or purchased)
2. **`locked`** - Test is paid and user hasn't purchased
3. **`auth_required`** - User must be logged in to access

## 📝 API Response Examples

### Success Response (Access Granted)
```json
{
  "id": "test-123",
  "title": "SAP Fundamentals",
  "questions": [...],
  "accessInfo": {
    "hasAccess": true,
    "isFree": false,
    "hasPurchased": true,
    "price": 29.99,
    "currency": "USD"
  }
}
```

### Auth Required Response (401)
```json
{
  "error": "Authentication required",
  "message": "You must be logged in to access this test",
  "requiresAuth": true,
  "testInfo": {
    "id": "test-123",
    "title": "SAP Fundamentals",
    "price": 29.99,
    "currency": "USD"
  }
}
```

### Purchase Required Response (403)
```json
{
  "error": "Access denied",
  "message": "This test requires purchase",
  "requiresPurchase": true,
  "testInfo": {
    "id": "test-123",
    "title": "SAP Fundamentals",
    "price": 29.99,
    "currency": "USD"
  }
}
```

## 🗄️ Database Migration

### Migration File
Location: `/supabase/migrations/20251118_001_test_access_rls.sql`

### What the Migration Does

1. **Enables RLS** on `user_test_purchases` table
2. **Creates Policies**:
   - Users can view their own purchases
   - Users can insert their own purchases
   - Service role can manage all purchases (for Stripe)

3. **Creates Helper Functions**:
   - `has_test_access(user_id, test_id)` - Check if user has access
   - `get_accessible_tests(user_id)` - Get all tests with access info

4. **Creates Indexes** for performance:
   - `idx_user_test_purchases_user_test_status` on (user_id, test_id, status)

### How to Apply the Migration

#### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `/supabase/migrations/20251118_001_test_access_rls.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute

#### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

#### Option 3: Manually via psql

```bash
psql postgresql://[connection-string] < supabase/migrations/20251118_001_test_access_rls.sql
```

## 🔧 Configuration Requirements

### Environment Variables (Already Set)

These should already be configured in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### Database Schema (Already Exists)

The following tables and columns should already exist:
- `tests` table with `price`, `currency`, `is_free` columns
- `user_test_purchases` table with purchase tracking
- `profiles` table with user information

## 🎨 UI Components

### Test Page Displays

1. **Authentication Required Screen**
   - Lock icon
   - Test information
   - "Sign In" and "Create Account" buttons
   - Clear messaging about why access is blocked

2. **Purchase Required Screen**
   - Premium badge
   - Test details with price
   - Feature highlights (Unlimited Access, Detailed Analytics)
   - "Purchase Test" and "Browse Tests" buttons
   - Attractive gradient design

3. **Error Screen**
   - Error icon
   - Error message
   - "Return to Home" button

### Dashboard Features

- Test cards show price badges
- "OWNED" chips on purchased tests
- Purchase buttons for paid tests
- "Add to Library" buttons for free tests
- Preview functionality for all tests

## 🧪 Testing the Implementation

### Test Scenarios

1. **Free Test Access**
   - ✅ Anonymous users can access free tests
   - ✅ Logged-in users can access free tests
   - ✅ No purchase required

2. **Paid Test - Anonymous User**
   - ✅ Shows "Authentication Required" screen
   - ✅ Redirects to login with test ID preserved
   - ✅ After login, shows purchase prompt

3. **Paid Test - Authenticated User Without Purchase**
   - ✅ Shows "Purchase Required" screen
   - ✅ Displays test price and features
   - ✅ Provides purchase button

4. **Paid Test - Authenticated User With Purchase**
   - ✅ Grants full access to test
   - ✅ Shows all questions
   - ✅ Allows test completion

### How to Test

1. **Create a Free Test**:
   ```sql
   UPDATE tests SET is_free = true, price = 0 WHERE id = 'test-id';
   ```

2. **Create a Paid Test**:
   ```sql
   UPDATE tests SET is_free = false, price = 29.99, currency = 'USD' WHERE id = 'test-id';
   ```

3. **Test Access**:
   - Try accessing as anonymous user
   - Try accessing as logged-in user without purchase
   - Purchase the test via Stripe
   - Try accessing as user with purchase

4. **Verify Database**:
   ```sql
   -- Check if purchase was recorded
   SELECT * FROM user_test_purchases WHERE test_id = 'test-id';

   -- Check access using helper function
   SELECT has_test_access('user-id', 'test-id');
   ```

## 🔐 Security Features

1. **Row-Level Security (RLS)**
   - Users can only see their own purchases
   - Service role bypass for Stripe webhooks
   - Prevents unauthorized data access

2. **Server-Side Enforcement**
   - All access checks happen on the server
   - Client cannot bypass restrictions
   - API returns appropriate error codes

3. **Database-Level Functions**
   - Helper functions use `SECURITY DEFINER`
   - Consistent access logic across the app
   - Performance optimized with indexes

## 📊 Performance Optimizations

1. **Batch Access Checks**
   - `checkMultipleTestsAccess()` for dashboard
   - Single query for multiple tests
   - Reduces database roundtrips

2. **Indexes**
   - Composite index on (user_id, test_id, status)
   - Faster purchase lookups
   - Improved query performance

3. **Caching Strategy**
   - Test data can be cached
   - Access checks are lightweight
   - Purchase status cached in session

## 🐛 Troubleshooting

### Common Issues

1. **"Access denied" for owned tests**
   - Check `user_test_purchases` table for active purchase
   - Verify `status = 'active'`
   - Check user_id matches authenticated user

2. **Free tests requiring auth**
   - Verify `is_free = true` or `price = 0` in tests table
   - Check access control logic in API

3. **Purchases not recorded**
   - Check Stripe webhook is configured
   - Verify webhook secret matches
   - Check webhook logs in Stripe dashboard

### Debug Queries

```sql
-- Check test pricing
SELECT id, title, price, currency, is_free FROM tests WHERE id = 'test-id';

-- Check user purchases
SELECT * FROM user_test_purchases WHERE user_id = 'user-id';

-- Check access for specific user/test
SELECT has_test_access('user-id', 'test-id');

-- Get all accessible tests for user
SELECT * FROM get_accessible_tests('user-id');
```

## 🚦 Next Steps

After applying the migration:

1. ✅ **Apply the database migration** (see instructions above)
2. ✅ **Configure test pricing** - Set `price`, `currency`, `is_free` on tests
3. ✅ **Test the flow** - Try accessing free and paid tests
4. ✅ **Test Stripe integration** - Make a test purchase
5. ✅ **Monitor logs** - Check for any errors in API responses
6. ✅ **Update admin UI** - Ensure admins can set test pricing

## 📖 API Reference

### Check Test Access (Server-Side)

```typescript
import { checkTestAccess } from '@/app/lib/test-access-control';
import { createServerSupabase } from '@/app/lib/auth-server';

const supabase = await createServerSupabase();
const { data: { user } } = await supabase.auth.getUser();

const accessResult = await checkTestAccess(supabase, user?.id || null, {
  id: testId,
  price: 29.99,
  currency: 'USD',
  is_free: false,
});

if (!accessResult.canAccess) {
  // Handle access denied
}
```

### Check Multiple Tests (Dashboard)

```typescript
import { checkMultipleTestsAccess } from '@/app/lib/test-access-control';

const accessMap = await checkMultipleTestsAccess(supabase, userId, tests);

tests.forEach(test => {
  const access = accessMap.get(test.id);
  console.log(`Test ${test.id}: ${access?.canAccess ? 'Accessible' : 'Locked'}`);
});
```

## 🎉 Benefits

1. **Security** - Server-side enforcement, RLS policies
2. **User Experience** - Clear messaging, beautiful UI
3. **Monetization** - Easy to add paid tests
4. **Scalability** - Efficient database queries
5. **Maintainability** - Centralized access logic
6. **Flexibility** - Easy to add new access rules

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the Supabase logs
3. Check Stripe webhook logs
4. Verify database migration was applied
5. Test with debug queries

---

**Implementation Date**: 2025-11-18
**Status**: ✅ Complete and Ready for Testing
