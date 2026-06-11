const SCOUT_API = process.env.SCOUT_API_URL || "https://scout.sentinelprime.org";
const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || "";

async function pingLegion(timeoutMs = 8000) {
  try {
    const res = await fetch(`${SCOUT_API}/health`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
}

async function wakeAndWait(maxWaitMs = 180_000) {
  if (SITE_URL) {
    await fetch(`${SITE_URL}/api/legion/wake`, { method: "POST" });
  }
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (await pingLegion(5000)) return true;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

export default async function handler() {
  const log = [];

  let online = await pingLegion(8000);
  log.push(`Legion online: ${online}`);

  if (!online) {
    log.push("Sending WoL and waiting up to 3 minutes...");
    online = await wakeAndWait(180_000);
    log.push(`Legion online after wake: ${online}`);
  }

  if (!online) {
    return new Response(JSON.stringify({ ok: false, error: "Legion did not come online", log }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(`${SCOUT_API}/scan`, { method: "POST", signal: AbortSignal.timeout(120_000) });
    const data = await res.json().catch(() => ({}));
    log.push(`Scout scan: ${res.status}`);
    return new Response(JSON.stringify({ ok: res.ok, log, data }), {
      status: res.ok ? 200 : res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Scan failed", log }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const config = {
  schedule: "0 7 * * *",
};
