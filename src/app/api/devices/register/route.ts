import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

type RegisterDeviceBody = {
  token?: unknown;
  platform?: unknown;
};

export async function POST(request: NextRequest) {
  let body: RegisterDeviceBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { error } = await supabase
    .from("push_devices")
    .upsert(
      {
        token,
        platform: platform || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
