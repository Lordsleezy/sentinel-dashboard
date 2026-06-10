import { NextResponse } from "next/server";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://136.118.148.167:9000";

export async function GET() {
  try {
    const res = await fetch(`${MEDUSA_URL}/store/products?limit=1`, {
      signal: AbortSignal.timeout(6000),
      headers: { "x-publishable-api-key": process.env.MEDUSA_API_KEY || "" },
    });

    if (!res.ok) {
      return NextResponse.json({ online: false, productCount: null });
    }

    const data = await res.json();
    const count = data?.count ?? data?.products?.length ?? null;

    return NextResponse.json({ online: true, productCount: count });
  } catch {
    return NextResponse.json({ online: false, productCount: null });
  }
}
