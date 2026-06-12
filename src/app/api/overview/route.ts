import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getMRR, getRecentPayments } from "@/lib/stripe";
import { listProducts } from "@/lib/medusa";
import { LEGION_URL } from "@/lib/config";
import { commandCorsHeaders, commandOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return commandOptionsResponse();
}

export async function GET() {
  const [mrrData, payments, products, scoutPending, listerPending, legionHealth] =
    await Promise.all([
      getMRR().catch(() => ({ mrr: 0, subscribers: 0, error: "Stripe unavailable" })),
      getRecentPayments(10).catch(() => []),
      listProducts(1).catch(() => []),
      countPending("scout_approvals"),
      countPending("lister_drafts"),
      pingHealth(`${LEGION_URL}/health`),
    ]);

  let productCount = 0;
  try {
    const all = await listProducts(200);
    productCount = all.length;
  } catch {
    productCount = products.length;
  }

  return NextResponse.json(
    {
      mrr: mrrData.mrr,
      subscribers: mrrData.subscribers,
      activeProducts: productCount,
      pendingScout: scoutPending,
      pendingLister: listerPending,
      legion: legionHealth,
      payments,
      errors: {
        stripe: "error" in mrrData ? mrrData.error : undefined,
      },
    },
    { headers: commandCorsHeaders }
  );
}

async function countPending(table: string) {
  const sb = getSupabase();
  if (!sb) return 0;
  const { count } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

async function pingHealth(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, ms: Date.now() - start };
  } catch {
    return { ok: false, ms: Date.now() - start };
  }
}
