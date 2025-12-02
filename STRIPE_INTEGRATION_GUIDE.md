# Stripe Integration Guide

This guide explains how to integrate Stripe payments into your Practice ERP exam platform.

## 🎯 What's Been Set Up

### 1. **Stripe Dependencies Installed**
- `stripe` - Server-side Stripe SDK
- `@stripe/stripe-js` - Client-side Stripe library

### 2. **Environment Variables Added**
Located in `.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### 3. **Stripe Configuration**
- `/app/lib/stripe.ts` - Server-side Stripe initialization

### 4. **API Endpoints Created**

#### **Checkout Session Creation**
`/app/api/stripe/create-checkout-session/route.ts`
- Creates a Stripe Checkout session
- Validates user authentication
- Checks if test is already purchased
- Redirects to Stripe's hosted checkout page

#### **Webhook Handler**
`/app/api/stripe/webhook/route.ts`
- Handles Stripe webhook events
- Processes successful payments
- Creates purchase records in database
- Handles refunds

### 5. **React Hook**
`/app/hooks/useStripeCheckout.ts`
- Custom hook for initiating checkout
- Handles loading states and errors
- Client-side Stripe integration

### 6. **UI Component**
`/app/components/stripe/PurchaseButton.tsx`
- Ready-to-use purchase button
- Loading states and error handling
- Customizable styling

---

## 🚀 Setup Instructions

### Step 1: Get Your Stripe Keys

1. **Sign up for Stripe** (if you haven't already):
   - Go to https://dashboard.stripe.com/register
   - Create your account

2. **Get your API keys**:
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your **Publishable key** (starts with `pk_`)
   - Copy your **Secret key** (starts with `sk_`)

   > ⚠️ **Important**: Use **Test mode** keys while developing (they start with `pk_test_` and `sk_test_`)

3. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

### Step 2: Set Up Webhooks

Webhooks allow Stripe to notify your app when payments succeed.

#### **For Local Development** (using Stripe CLI):

1. **Install Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (using Scoop)
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** shown in the terminal output:
   ```bash
   # It will show something like:
   # Your webhook signing secret is whsec_xxxxx
   ```

5. **Add to `.env.local`**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

#### **For Production** (Vercel, etc.):

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your production URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** and add it to your production environment variables

### Step 3: Restart Your Dev Server

After updating `.env.local`, restart the development server:

```bash
# Kill the current server (Ctrl+C or kill the process)
# Then start it again:
npm run dev
```

---

## 💳 How to Use in Your App

### Option 1: Use the PurchaseButton Component

```tsx
import { PurchaseButton } from '@/app/components/stripe/PurchaseButton';

// In your test card or dashboard
<PurchaseButton
  testId={test.id}
  testTitle={test.title}
  price={test.price}
  currency={test.currency || 'USD'}
  variant="default"
/>
```

### Option 2: Use the Hook Directly

```tsx
'use client';

import { useStripeCheckout } from '@/app/hooks/useStripeCheckout';

export function MyComponent() {
  const { createCheckoutSession, loading, error } = useStripeCheckout();

  const handlePurchase = async (testId: string) => {
    try {
      await createCheckoutSession(testId);
      // User will be redirected to Stripe Checkout
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };

  return (
    <button
      onClick={() => handlePurchase(testId)}
      disabled={loading}
    >
      {loading ? 'Processing...' : 'Buy Now'}
    </button>
  );
}
```

### Example: Integration in Dashboard

Update `/app/dashboard/MaterialDashboard.tsx` to add purchase buttons:

```tsx
import { PurchaseButton } from '@/app/components/stripe/PurchaseButton';

// In the test card rendering section:
{!test.is_free && (
  <PurchaseButton
    testId={test.id}
    testTitle={test.title}
    price={test.price}
    currency={test.currency}
  />
)}
```

---

## 🧪 Testing the Integration

### Test Cards (Use in Stripe Test Mode):

- **Successful payment**: `4242 4242 4242 4242`
- **Payment requires authentication**: `4000 0025 0000 3155`
- **Payment is declined**: `4000 0000 0000 9995`

**Card Details for Testing:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Testing Workflow:

1. Set a test price in your admin panel (make sure `is_free` is false)
2. Click the purchase button
3. You'll be redirected to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete the payment
6. You'll be redirected back to `/dashboard?payment=success&test_id=xxx`
7. Check your database - the purchase should be recorded in `user_test_purchases`

---

## 🔒 Security Best Practices

1. **Never expose your Secret Key** (`STRIPE_SECRET_KEY`) in client-side code
2. **Always verify webhook signatures** (already handled in the webhook route)
3. **Use HTTPS in production** (required by Stripe)
4. **Validate prices server-side** (already implemented - we fetch from database, not from client)
5. **Use test mode** during development

---

## 🎨 Customization

### Change Supported Payment Methods

Edit `/app/lib/stripe.ts`:

```typescript
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card', 'apple_pay', 'google_pay'], // Add more
};
```

### Customize Success/Cancel URLs

Edit `/app/api/stripe/create-checkout-session/route.ts`:

```typescript
success_url: `${origin}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${origin}/purchase-cancelled`,
```

### Add Subscription Support

Currently set up for one-time payments. To add subscriptions:

1. Create Stripe Products and Prices in your dashboard
2. Use `mode: 'subscription'` instead of `mode: 'payment'`
3. Reference the Price ID instead of creating inline prices

---

## 📊 Monitoring Payments

### Stripe Dashboard

Monitor all payments at: https://dashboard.stripe.com/payments

### Your Database

Query purchases:

```sql
SELECT
  u.email,
  t.title as test_name,
  p.payment_amount,
  p.purchase_date,
  p.status
FROM user_test_purchases p
JOIN profiles u ON p.user_id = u.id
JOIN tests t ON p.test_id = t.id
ORDER BY p.purchase_date DESC;
```

---

## 🐛 Troubleshooting

### "Stripe failed to load"
- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Make sure you've restarted the dev server after adding env variables

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI or dashboard
- Check that you're forwarding webhooks correctly with Stripe CLI

### "Payment succeeded but purchase not recorded"
- Check webhook logs: `stripe listen --forward-to localhost:3000/api/stripe/webhook --print-secret`
- Verify the webhook endpoint is accessible
- Check console logs for errors in the webhook handler

### "User already purchased this test"
- This is intentional! The system prevents duplicate purchases
- Check the `user_test_purchases` table for existing records

---

## 🔄 What Happens During a Purchase

1. **User clicks "Purchase" button** → triggers `createCheckoutSession()`
2. **API creates Stripe Checkout session** → validates user, test, and price
3. **User redirected to Stripe Checkout** → Stripe's secure payment page
4. **User completes payment** → enters card details and confirms
5. **Stripe sends webhook event** → `checkout.session.completed`
6. **Webhook handler processes event** → creates record in `user_test_purchases`
7. **User redirected back** → to your app's success page
8. **Test appears in user's library** → ready to take!

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## ✅ Next Steps

1. ✅ Get Stripe API keys from dashboard
2. ✅ Update `.env.local` with your keys
3. ✅ Set up webhook forwarding for local development
4. ✅ Test a payment with test card
5. ✅ Integrate PurchaseButton into your UI
6. ✅ Test the full purchase flow
7. ✅ Set up production webhooks when deploying

---

**Need help?** Check the Stripe logs in your dashboard or run `stripe logs tail` in your terminal to see real-time webhook events.
