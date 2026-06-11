import { NextResponse } from "next/server";
import { SCOUT_HEALTH_URL } from "@/lib/config";

export async function GET() {
  const url = process.env.SCOUT_HEALTH_URL || SCOUT_HEALTH_URL;
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return NextResponse.json({
      online: res.ok,
      ms: Date.now() - start,
      url,
    });
  } catch {
    return NextResponse.json({
      online: false,
      ms: Date.now() - start,
      url,
    });
  }
}
