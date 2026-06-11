import { NextRequest } from "next/server";
import { DEFAULT_PASSWORD } from "@/lib/config";

export function verifyDashboardAuth(request: NextRequest): boolean {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.DASHBOARD_API_TOKEN;
  return Boolean(expected && token && token === expected);
}

export function verifyDashboardPassword(password: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD || DEFAULT_PASSWORD;
  return password === expected;
}
