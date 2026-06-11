import { NextResponse } from "next/server";
import { fetchInvestApi } from "@/lib/invest";
import { MOCK_PORTFOLIO } from "@/lib/invest-mock";

export async function GET() {
  const data = await fetchInvestApi("/portfolio", MOCK_PORTFOLIO);
  return NextResponse.json(data);
}
