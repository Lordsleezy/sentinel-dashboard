import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export async function getMRR() {
  const s = getStripe();
  if (!s) return { mrr: 0, subscribers: 0, error: "Stripe not configured" };

  const subs = await s.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.items.data.price"],
  });

  let mrr = 0;
  for (const sub of subs.data) {
    for (const item of sub.items.data) {
      const price = item.price;
      if (!price?.unit_amount) continue;
      const amount = price.unit_amount / 100;
      if (price.recurring?.interval === "year") {
        mrr += amount / 12;
      } else {
        mrr += amount * (item.quantity ?? 1);
      }
    }
  }

  return { mrr: Math.round(mrr * 100) / 100, subscribers: subs.data.length };
}

export async function getRecentPayments(limit = 10) {
  const s = getStripe();
  if (!s) return [];

  const charges = await s.charges.list({ limit });
  return charges.data.map((c) => ({
    id: c.id,
    amount: (c.amount ?? 0) / 100,
    currency: c.currency,
    status: c.status,
    customer: typeof c.customer === "string" ? c.customer : c.customer?.id ?? "",
    created: new Date((c.created ?? 0) * 1000).toISOString(),
    description: c.description ?? "",
  }));
}

export async function getMRRHistory() {
  const s = getStripe();
  if (!s) return [];

  const months: { month: string; mrr: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });

    const invoices = await s.invoices.list({
      status: "paid",
      created: { gte: Math.floor(d.getTime() / 1000), lte: Math.floor(end.getTime() / 1000) },
      limit: 100,
    });

    const total = invoices.data.reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0) / 100;
    months.push({ month: label, mrr: Math.round(total * 100) / 100 });
  }

  return months;
}
