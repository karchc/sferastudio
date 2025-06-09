import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: purchasedTests, error } = await supabase
      .from("user_test_purchases")
      .select(`
        id,
        purchase_date,
        payment_amount,
        test:tests (
          id,
          title,
          description,
          time_limit,
          price,
          currency,
          is_free,
          category_ids
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("purchase_date", { ascending: false });

    if (error) {
      console.error("Error fetching purchased tests:", error);
      return NextResponse.json({ error: "Failed to fetch purchased tests" }, { status: 500 });
    }

    // Return data structure with only purchased tests
    const response = {
      purchasedTests: purchasedTests?.map(purchase => ({
        purchaseId: purchase.id,
        purchaseDate: purchase.purchase_date,
        paymentAmount: purchase.payment_amount,
        test: purchase.test
          ? {
              id: purchase.test.id,
              title: purchase.test.title,
              description: purchase.test.description,
              time_limit: purchase.test.time_limit,
              price: purchase.test.price,
              currency: purchase.test.currency,
              is_free: purchase.test.is_free,
              category_ids: purchase.test.category_ids,
            }
          : null,
      })) || [],
      totalPurchased: purchasedTests?.length || 0,
    };

    console.log("Response data:", response.purchasedTests);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { test_id, status = 'active' } = await req.json();

    if (!test_id) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 });
    }

    // Check if test exists
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id, title, price, currency, is_free")
      .eq("id", test_id)
      .single();

    if (testError || !test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    // Check if user already owns this test
    const { data: existingPurchase, error: existingError } = await supabase
      .from("user_test_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("test_id", test_id)
      .eq("status", "active")
      .single();

    if (existingPurchase) {
      return NextResponse.json({ error: "You already own this test" }, { status: 409 });
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("user_test_purchases")
      .insert({
        user_id: user.id,
        test_id: test_id,
        status: status,
        purchase_date: new Date().toISOString(),
        payment_amount: test.is_free ? 0 : (test.price || 0),
        currency: test.currency || 'USD'
      })
      .select()
      .single();

    if (purchaseError) {
      console.error("Error creating purchase:", purchaseError);
      return NextResponse.json({ error: "Failed to purchase test" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      purchase: purchase,
      message: `Successfully purchased ${test.title}!`
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}