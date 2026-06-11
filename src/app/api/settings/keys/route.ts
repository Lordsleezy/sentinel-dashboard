import { NextResponse } from "next/server";

function mask(val: string | undefined) {
  if (!val) return "—";
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••" + val.slice(-4);
}

export async function GET() {
  return NextResponse.json({
    stripe: mask(process.env.STRIPE_SECRET_KEY),
    supabase: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    medusa: mask(process.env.MEDUSA_API_KEY),
    serper: mask(process.env.SERPER_API_KEY),
    github: mask(process.env.GITHUB_TOKEN),
    netlifyHook: process.env.NETLIFY_DEPLOY_HOOK ? "Configured" : "—",
    wol: mask(process.env.WOL_MAC_ADDRESS),
    legionSsh: process.env.LEGION_SSH_HOST ? "Configured" : "—",
    dashboardToken: process.env.DASHBOARD_API_TOKEN ? "Configured" : "—",
  });
}
