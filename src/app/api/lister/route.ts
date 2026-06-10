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
    .from("lister_drafts")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, title, description, price } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const sb = getSupabase();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const { data, error } = await sb
    .from("lister_drafts")
    .update({ title, description, price, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
