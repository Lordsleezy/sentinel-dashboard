import { NextResponse } from "next/server";
import { triggerNetlifyDeploy } from "@/lib/github";

export async function POST() {
  const result = await triggerNetlifyDeploy();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
