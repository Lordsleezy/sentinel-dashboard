import { NextRequest, NextResponse } from "next/server";
import { LISTER_API } from "@/lib/config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, id, payload } = body as { action: string; id?: string; payload?: object };

  let url = LISTER_API;
  if (action === "list") url += "/list";
  else if (action === "approve" && id) url += `/approve/${id}`;
  else if (action === "reject" && id) url += `/reject/${id}`;
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lister request failed" },
      { status: 502 }
    );
  }
}
