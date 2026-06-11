import { NextResponse } from "next/server";
import { fetchInvestApi } from "@/lib/invest";
import { getMockWatchlist } from "@/lib/invest-mock";

export async function GET() {
  const data = await fetchInvestApi("/watchlist", { items: getMockWatchlist() });
  return NextResponse.json(data);
}
