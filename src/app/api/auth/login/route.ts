import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardPassword } from "@/lib/dashboard-auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = (body as { password?: string }).password;
  if (!password || !verifyDashboardPassword(password)) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401, headers: corsHeaders }
    );
  }

  const token = process.env.DASHBOARD_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "DASHBOARD_API_TOKEN not configured" },
      { status: 503, headers: corsHeaders }
    );
  }

  return NextResponse.json({ token }, { headers: corsHeaders });
}
