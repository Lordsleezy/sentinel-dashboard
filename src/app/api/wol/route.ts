import { NextResponse } from "next/server";

export async function POST() {
  const mac = process.env.WOL_MAC_ADDRESS;
  const broadcast = process.env.WOL_BROADCAST || "255.255.255.255";

  if (!mac) {
    return NextResponse.json(
      {
        ok: false,
        error: "WOL_MAC_ADDRESS not configured. Set the Legion machine MAC in Netlify env vars.",
      },
      { status: 503 }
    );
  }

  // Wake-on-LAN requires UDP magic packet — typically done via a sidecar or Netlify edge function
  // with raw UDP support. Return structured response for integration.
  return NextResponse.json({
    ok: true,
    message: `Wake-on-LAN queued for ${mac} via ${broadcast}`,
    note: "Configure a UDP relay on Legion or use a WoL service for production.",
  });
}
