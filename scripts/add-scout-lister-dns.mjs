/**
 * Add scout + lister CNAMEs to sentinelprime.org in Cloudflare.
 * Usage: CF_API_TOKEN=xxx node scripts/add-scout-lister-dns.mjs
 */
const ZONE = "sentinelprime.org";
const TUNNEL_CNAME = "bc6619f8-db74-488e-9a4f-6f063f71d78e.cfargotunnel.com";
const RECORDS = ["scout", "lister"];

const token = process.env.CF_API_TOKEN;
if (!token) {
  console.error("Set CF_API_TOKEN (Cloudflare API token with Zone.DNS edit)");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const zoneRes = await fetch(
  `https://api.cloudflare.com/client/v4/zones?name=${ZONE}`,
  { headers }
);
const zoneData = await zoneRes.json();
const zoneId = zoneData.result?.[0]?.id;
if (!zoneId) {
  console.error("Zone not found:", zoneData);
  process.exit(1);
}

for (const name of RECORDS) {
  const hostname = `${name}.${ZONE}`;
  const listRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${hostname}`,
    { headers }
  );
  const existing = (await listRes.json()).result?.[0];

  const body = {
    type: "CNAME",
    name,
    content: TUNNEL_CNAME,
    proxied: true,
    ttl: 1,
  };

  if (existing) {
    const upd = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`,
      { method: "PATCH", headers, body: JSON.stringify(body) }
    );
    console.log(hostname, (await upd.json()).success ? "updated" : "update failed");
  } else {
    const cre = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      { method: "POST", headers, body: JSON.stringify(body) }
    );
    const data = await cre.json();
    console.log(hostname, data.success ? "created" : data.errors);
  }
}

console.log("Done. Verify: nslookup scout.sentinelprime.org");
