import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/app/lib/stripe';
import { createServerSupabase } from '@/app/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testId } = body;

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Fetch test details
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id, title, description, price, currency, is_free')
      .eq('id', testId)
      .single() as { data: { id: string; title: string; description: string | null; price: number; currency: string; is_free: boolean } | null; error: any };

    if (testError || !test) {
      return NextResponse.json(
        { error: 'Test not found' },
        { status: 404 }
      );
    }

    // Check if test is free
    if (test.is_free || !test.price || test.price <= 0) {
      return NextResponse.json(
        { error: 'This test is free and does not require payment' },
        { status: 400 }
      );
    }

    // Check if user already purchased this test
    const { data: existingPurchase } = await supabase
      .from('user_test_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('test_id', testId)
      .eq('status', 'active')
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'You have already purchased this test' },
        { status: 400 }
      );
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single() as { data: { email: string; full_name: string } | null; error: any };

    // Get the correct origin URL (works for both localhost and Codespaces)
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('?')[0].replace(/\/$/, '') || 'http://localhost:3000';
    console.log("origin:", request.headers.get("origin"));
    console.log("referer:", request.headers.get("referer"));

    // Determine customer email
    const customerEmail = profile?.email || user.email || '';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: STRIPE_CONFIG.paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: test.currency?.toLowerCase() || STRIPE_CONFIG.currency,
            product_data: {
              name: test.title,
              description: test.description || 'Practice SAP Exam Test',
            },
            unit_amount: Math.round(test.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get("referer")}?payment=success&test_id=${testId}`,
      cancel_url: `${request.headers.get("referer")}?payment=cancelled`,
      customer_email: customerEmail,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        testId: testId,
        testTitle: test.title,
      },
      // Enable receipt emails (Stripe will send automatically)
      ...(customerEmail ? {
        payment_intent_data: {
          receipt_email: customerEmail,
        },
      } : {}),
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
