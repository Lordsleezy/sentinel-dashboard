import { NextResponse } from "next/server";
import { storeHeaders } from "@/lib/medusa";

const MEDUSA_URL = (process.env.NEXT_PUBLIC_MEDUSA_URL || "https://legion.sentinelprime.org").replace(/\/$/, "");

export async function GET() {
  try {
    const res = await fetch(`${MEDUSA_URL}/store/products?limit=1`, {
      signal: AbortSignal.timeout(6000),
      headers: storeHeaders(),
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
