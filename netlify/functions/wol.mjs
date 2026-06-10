export async function handler() {
  const mac = process.env.WOL_MAC_ADDRESS;
  if (!mac) {
    return {
      statusCode: 503,
      body: JSON.stringify({ ok: false, error: "WOL_MAC_ADDRESS not configured" }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message: `Wake-on-LAN queued for ${mac}`,
      note: "UDP magic packet requires a relay on the Legion host.",
    }),
  };
}
