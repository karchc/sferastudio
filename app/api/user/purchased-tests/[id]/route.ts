import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/auth-server";

export async function GET(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase();
    const userId = params.id;

    // If no user ID provided, get current user
    let targetUserId = userId;
    if (!userId || userId === 'current') {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      targetUserId = user.id;
    }

    // Fetch user's purchased tests with full test details and categories
    const { data: purchasedTests, error } = await supabase
      .from("user_test_purchases")
      .select(`
        id,
        purchase_date,
        payment_amount,
        payment_method,
        transaction_id,
        status,
        test:tests (
          id,
          title,
          description,
          time_limit,
          price,
          currency,
          is_free,
          category_ids,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", targetUserId)
      .eq("status", "active")
      .order("purchase_date", { ascending: false });

    if (error) {
      console.error("Error fetching purchased tests:", error);
      return NextResponse.json({ 
        error: "Failed to fetch purchased tests",
        details: error.message 
      }, { status: 500 });
    }

    // Get category details for the tests
    const categoryIds = new Set<string>();
    purchasedTests?.forEach(p => {
      if (p.test?.category_ids) {
        p.test.category_ids.forEach((id: string) => categoryIds.add(id));
      }
    });

    let categories: any[] = [];
    if (categoryIds.size > 0) {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name, description")
        .in("id", Array.from(categoryIds));

      if (!categoryError && categoryData) {
        categories = categoryData;
      }
    }

    // Create a category lookup map
    const categoryMap = new Map(categories.map(c => [c.id, c]));


    // Format the response with enriched data
    const response = {
      userId: targetUserId,
      purchasedTests: purchasedTests?.map(purchase => ({
        purchaseId: purchase.id,
        purchaseDate: purchase.purchase_date,
        paymentAmount: purchase.payment_amount,
        paymentMethod: purchase.payment_method,
        transactionId: purchase.transaction_id,
        status: purchase.status,
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
              categories: purchase.test.category_ids?.map((id: string) => categoryMap.get(id)).filter(Boolean) || [],
              created_at: purchase.test.created_at,
              updated_at: purchase.test.updated_at,
            }
          : null,
      })) || [],
      totalPurchased: purchasedTests?.length || 0,
      allCategories: Array.from(categoryMap.values()),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}