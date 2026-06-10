import { NextRequest, NextResponse } from "next/server";
import { getRecentPayments } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const limit = Number(new URL(request.url).searchParams.get("limit") || "20");
  try {
    const payments = await getRecentPayments(limit);
    return NextResponse.json({ payments });
  } catch (e) {
    return NextResponse.json(
      { payments: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
