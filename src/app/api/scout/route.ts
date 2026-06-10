import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Supabase not configured", items: [] }, { status: 503 });
  }
  const { data, error } = await sb
    .from("scout_approvals")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
