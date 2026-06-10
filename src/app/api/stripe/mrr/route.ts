import { NextResponse } from "next/server";
import { getMRRHistory } from "@/lib/stripe";

export async function GET() {
  try {
    const data = await getMRRHistory();
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { data: [], error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
