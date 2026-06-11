import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const base = new URL(request.url).origin;
  const res = await fetch(`${base}/api/legion/wake`, { method: "POST" });
  const data = await res.json();
  return NextResponse.json(
    res.ok
      ? { ok: true, message: `Wake-on-LAN sent to ${data.mac}`, ...data }
      : { ok: false, error: data.error || "Wake failed" },
    { status: res.status }
  );
}
