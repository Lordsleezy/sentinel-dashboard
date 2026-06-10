import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { SENTINEL_PRODUCTS } from "@/lib/config";
import { readPricingFile, updatePricingFile, triggerNetlifyDeploy } from "@/lib/github";
import { updateVariantPrice } from "@/lib/medusa";

export async function GET() {
  const stripe = getStripe();
  const githubPricing = await readPricingFile();

  if (!stripe) {
    return NextResponse.json({
      products: SENTINEL_PRODUCTS.map((p) => ({
        ...p,
        price: (githubPricing[p.key] as number) ?? null,
        stripePriceId: null,
        error: "Stripe not configured",
      })),
    });
  }

  const prices = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] });
  const products = SENTINEL_PRODUCTS.map((sp) => {
    const match = prices.data.find((p) => {
      const prod = p.product as { name?: string; metadata?: Record<string, string> } | null;
      const name = (prod?.name || "").toLowerCase();
      const meta = prod?.metadata?.sentinel_key || "";
      return meta === sp.key || name.includes(sp.name.toLowerCase()) || name.includes(sp.stripeLookup);
    });
    return {
      ...sp,
      price: match ? (match.unit_amount ?? 0) / 100 : ((githubPricing[sp.key] as number) ?? null),
      stripePriceId: match?.id ?? null,
      productId: typeof match?.product === "string" ? match.product : match?.product?.id,
    };
  });

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { key, newPrice, medusaVariantId } = body;
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const productDef = SENTINEL_PRODUCTS.find((p) => p.key === key);
  if (!productDef) return NextResponse.json({ error: "Unknown product" }, { status: 400 });

  const amountCents = Math.round(newPrice * 100);

  const prices = await stripe.prices.list({ active: true, limit: 100, expand: ["data.product"] });
  const existing = prices.data.find((p) => {
    const prod = p.product as { metadata?: Record<string, string>; name?: string } | null;
    return (
      prod?.metadata?.sentinel_key === key ||
      (prod?.name || "").toLowerCase().includes(productDef.name.toLowerCase())
    );
  });

  let newPriceId: string | undefined;
  if (existing) {
    const newStripePrice = await stripe.prices.create({
      unit_amount: amountCents,
      currency: "usd",
      product: typeof existing.product === "string" ? existing.product : existing.product?.id,
      ...(existing.recurring
        ? {
            recurring: {
              interval: existing.recurring.interval,
              interval_count: existing.recurring.interval_count ?? 1,
            },
          }
        : {}),
    });
    await stripe.prices.update(existing.id, { active: false });
    newPriceId = newStripePrice.id;
  }

  if (medusaVariantId) {
    await updateVariantPrice(medusaVariantId, amountCents);
  }

  const pricing = await readPricingFile();
  pricing[key] = newPrice;
  const gh = await updatePricingFile(pricing, `chore: update ${productDef.name} price to $${newPrice}`);
  if (!gh.ok) {
    return NextResponse.json({ error: gh.error, partial: true }, { status: 500 });
  }

  await triggerNetlifyDeploy();

  return NextResponse.json({ ok: true, stripePriceId: newPriceId });
}
