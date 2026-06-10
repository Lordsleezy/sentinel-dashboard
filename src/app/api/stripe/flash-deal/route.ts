import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { readPricingFile, updatePricingFile, triggerNetlifyDeploy } from "@/lib/github";
import { updateVariantPrice } from "@/lib/medusa";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const { productKey, salePrice, durationHours, medusaVariantId, originalPrice } = await request.json();
  if (!productKey || !salePrice || !durationHours) {
    return NextResponse.json({ error: "productKey, salePrice, durationHours required" }, { status: 400 });
  }

  const redeemBy = Math.floor(Date.now() / 1000) + durationHours * 3600;
  const coupon = await stripe.coupons.create({
    name: `Flash: ${productKey}`,
    percent_off: originalPrice
      ? Math.round((1 - salePrice / originalPrice) * 100)
      : undefined,
    amount_off: !originalPrice ? Math.round(salePrice * 100) : undefined,
    duration: "once",
    redeem_by: redeemBy,
    metadata: { product_key: productKey, flash_deal: "true" },
  });

  if (medusaVariantId) {
    await updateVariantPrice(medusaVariantId, Math.round(salePrice * 100));
  }

  const pricing = await readPricingFile();
  pricing[`${productKey}_flash`] = { price: salePrice, expires: redeemBy, original: originalPrice };
  pricing[productKey] = salePrice;
  await updatePricingFile(pricing, `flash deal: ${productKey} at $${salePrice} for ${durationHours}h`);
  await triggerNetlifyDeploy();

  return NextResponse.json({
    ok: true,
    couponId: coupon.id,
    expiresAt: new Date(redeemBy * 1000).toISOString(),
  });
}
