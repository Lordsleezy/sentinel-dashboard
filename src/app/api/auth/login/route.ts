import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardPassword } from "@/lib/dashboard-auth";
import { commandCorsHeaders, commandOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return commandOptionsResponse();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = (body as { password?: string }).password;
  if (!password || !verifyDashboardPassword(password)) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401, headers: commandCorsHeaders }
    );
  }

  const token = process.env.DASHBOARD_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "DASHBOARD_API_TOKEN not configured" },
      { status: 503, headers: commandCorsHeaders }
    );
  }

  return NextResponse.json({ token }, { headers: commandCorsHeaders });
}
