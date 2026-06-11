import { NextResponse } from "next/server";
import { fetchInvestApi } from "@/lib/invest";
import { MOCK_NEWS } from "@/lib/invest-mock";

export async function GET() {
  const data = await fetchInvestApi("/news", { items: MOCK_NEWS });
  return NextResponse.json(data);
}
