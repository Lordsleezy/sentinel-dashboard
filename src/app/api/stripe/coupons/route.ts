import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function GET() {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ coupons: [], error: "Stripe not configured" });

  const coupons = await stripe.coupons.list({ limit: 50 });
  const active = coupons.data.filter((c) => c.valid);
  return NextResponse.json({
    coupons: active.map((c) => ({
      id: c.id,
      name: c.name,
      percentOff: c.percent_off,
      amountOff: c.amount_off ? c.amount_off / 100 : null,
      duration: c.duration,
      redeemBy: c.redeem_by ? new Date(c.redeem_by * 1000).toISOString() : null,
      timesRedeemed: c.times_redeemed,
      valid: c.valid,
    })),
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = await request.json();
  const { name, percentOff, amountOff, expiryDate } = body;

  const params: Parameters<typeof stripe.coupons.create>[0] = {
    name,
    duration: "once",
  };
  if (percentOff) params.percent_off = percentOff;
  if (amountOff) params.amount_off = Math.round(amountOff * 100);
  if (expiryDate) params.redeem_by = Math.floor(new Date(expiryDate).getTime() / 1000);

  const coupon = await stripe.coupons.create(params);
  return NextResponse.json({ coupon: { id: coupon.id, name: coupon.name } });
}

export async function DELETE(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await stripe.coupons.del(id);
  return NextResponse.json({ ok: true });
}
