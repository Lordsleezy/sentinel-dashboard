const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || "";

export async function handler() {
  if (!SITE_URL) {
    return {
      statusCode: 503,
      body: JSON.stringify({ ok: false, error: "URL not configured" }),
    };
  }

  const res = await fetch(`${SITE_URL}/api/legion/wake`, { method: "POST" });
  const data = await res.json();
  return {
    statusCode: res.status,
    body: JSON.stringify(res.ok ? { ok: true, ...data } : { ok: false, error: data.error }),
  };
}
