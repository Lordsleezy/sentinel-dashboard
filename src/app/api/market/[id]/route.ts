import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, updateProduct, updateVariantPrice } from "@/lib/medusa";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  try {
    if (body.price !== undefined && body.variantId) {
      await updateVariantPrice(body.variantId, Math.round(body.price * 100));
    }
    if (body.status !== undefined) {
      await updateProduct(id, { status: body.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
