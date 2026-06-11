import { SCOUT_API } from "@/lib/config";

export async function pingLegion(timeoutMs = 8000): Promise<boolean> {
  try {
    const res = await fetch(`${SCOUT_API}/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function wakeAndWait(maxWaitMs = 180_000): Promise<boolean> {
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000";
  await fetch(`${base}/api/legion/wake`, { method: "POST" });

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (await pingLegion(5000)) return true;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}
