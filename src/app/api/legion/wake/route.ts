import { NextResponse } from "next/server";
import wake from "wakeonlan";
import { commandCorsHeaders, commandOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return commandOptionsResponse();
}

export async function POST() {
  const mac = process.env.WOL_MAC_ADDRESS;
  if (!mac) {
    return NextResponse.json(
      { error: "WOL_MAC_ADDRESS not configured" },
      { status: 503, headers: commandCorsHeaders }
    );
  }

  try {
    await wake(mac, { address: process.env.WOL_BROADCAST || "255.255.255.255" });
    return NextResponse.json({ status: "magic packet sent", mac }, { headers: commandCorsHeaders });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Wake failed" },
      { status: 500, headers: commandCorsHeaders }
    );
  }
}
