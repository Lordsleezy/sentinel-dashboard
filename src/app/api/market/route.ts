import { NextResponse } from "next/server";
import { listProducts } from "@/lib/medusa";

export async function GET() {
  try {
    const products = await listProducts(200);
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load products", products: [] },
      { status: 500 }
    );
  }
}
