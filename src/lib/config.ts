export const DEFAULT_PASSWORD = "sentinelprime2026";

export const AUTH_STORAGE_KEY = "sentinel_auth";
export const PASSWORD_STORAGE_KEY = "sentinel_dashboard_password";

export const SCOUT_API = "https://scout.sentinelprime.org";
export const LISTER_API = "https://lister.sentinelprime.org";
export const LEGION_URL = "https://legion.sentinelprime.org";
export const MARKET_URL = "https://market.sentinelprime.org";

export const SENTINEL_PRODUCTS = [
  { key: "shift", name: "Shift", stripeLookup: "shift" },
  { key: "shield", name: "Shield", stripeLookup: "shield" },
  { key: "care_basic", name: "Care Basic", stripeLookup: "care_basic" },
  { key: "care_plus", name: "Care Plus", stripeLookup: "care_plus" },
  { key: "sentinel_prime_x", name: "Sentinel Prime X", stripeLookup: "sentinel_prime_x" },
] as const;

export const LEGION_SERVICES = [
  { name: "Ollama", url: "http://localhost:11434/api/tags", publicUrl: `${LEGION_URL}/health/ollama`, useProxy: true },
  { name: "Medusa (Legion)", url: `${LEGION_URL}/health`, publicUrl: `${LEGION_URL}/health` },
  { name: "Scout", url: `${SCOUT_API}/health`, publicUrl: `${SCOUT_API}/health` },
  { name: "Lister", url: `${LISTER_API}/health`, publicUrl: `${LISTER_API}/health` },
  { name: "Cloudflare Tunnel", url: `${LEGION_URL}/health`, publicUrl: `${LEGION_URL}/health` },
] as const;

export const GITHUB_PRICING_PATH =
  process.env.GITHUB_PRICING_PATH || "src/config/pricing.json";
