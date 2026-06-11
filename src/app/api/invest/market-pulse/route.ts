import { NextResponse } from "next/server";
import { fetchInvestApi } from "@/lib/invest";
import { MOCK_MARKET_PULSE } from "@/lib/invest-mock";

export async function GET() {
  const data = await fetchInvestApi("/market-pulse", MOCK_MARKET_PULSE);
  return NextResponse.json(data);
}
