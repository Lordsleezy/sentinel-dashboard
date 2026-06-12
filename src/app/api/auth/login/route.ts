import { NextRequest, NextResponse } from "next/server";
import { verifyDashboardPassword } from "@/lib/dashboard-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const password = (body as { password?: string }).password;
  if (!password || !verifyDashboardPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = process.env.DASHBOARD_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "DASHBOARD_API_TOKEN not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ token });
}
