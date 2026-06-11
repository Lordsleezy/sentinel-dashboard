import { NextRequest, NextResponse } from "next/server";
import { INVEST_API } from "@/lib/config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const res = await fetch(`${INVEST_API}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return NextResponse.json(data);
    return NextResponse.json(
      { error: (data as { error?: string }).error || "Trade failed", mock: true, accepted: body },
      { status: res.status }
    );
  } catch {
    return NextResponse.json({
      ok: true,
      mock: true,
      message: "Trade recorded (mock — invest backend offline)",
      trade: body,
    });
  }
}
