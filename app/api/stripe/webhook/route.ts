import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/app/lib/stripe';
import { createServerSupabase } from '@/app/lib/auth-server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const userId = session.metadata?.userId;
        const testId = session.metadata?.testId;
        const testTitle = session.metadata?.testTitle;

        if (!userId || !testId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Create Supabase client (using service role would be better for webhooks)
        const supabase = await createServerSupabase();

        // Check if purchase already exists
        const { data: existingPurchase } = await supabase
          .from('user_test_purchases')
          .select('id')
          .eq('user_id', userId)
          .eq('test_id', testId)
          .eq('status', 'active')
          .single();

        if (existingPurchase) {
          console.log('Purchase already recorded for user:', userId, 'test:', testId);
          break;
        }

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
          .from('user_test_purchases')
          .insert({
            user_id: userId,
            test_id: testId,
            payment_amount: (session.amount_total || 0) / 100, // Convert from cents
            payment_method: 'stripe',
            transaction_id: session.payment_intent as string,
            status: 'active',
          })
          .select()
          .single();

        if (purchaseError) {
          console.error('Error creating purchase record:', purchaseError);
          throw new Error('Failed to create purchase record');
        }

        console.log('✅ Successfully created purchase record:', purchase.id);
        console.log(`User ${userId} purchased test "${testTitle}" (${testId})`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', paymentIntent.id);
        // You could send an email notification here
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = charge.payment_intent as string;

        if (paymentIntent) {
          const supabase = await createServerSupabase();

          // Mark purchase as refunded
          const { error: refundError } = await supabase
            .from('user_test_purchases')
            .update({
              status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('transaction_id', paymentIntent);

          if (refundError) {
            console.error('Error updating refund status:', refundError);
          } else {
            console.log('✅ Purchase marked as refunded for payment:', paymentIntent);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
