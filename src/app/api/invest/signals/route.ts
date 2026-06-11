import { NextResponse } from "next/server";
import { fetchInvestApi } from "@/lib/invest";
import { MOCK_SIGNALS } from "@/lib/invest-mock";

export async function GET() {
  const data = await fetchInvestApi("/signals", { signals: MOCK_SIGNALS });
  return NextResponse.json(data);
}
