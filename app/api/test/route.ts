import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";

export async function GET(req: NextRequest) {
  // Fetch all tests, without questions
  const { data: tests, error } = await supabase
    .from("tests")
    .select("*")
    .order("id");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }

  return NextResponse.json(tests || []);
}