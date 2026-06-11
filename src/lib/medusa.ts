const MEDUSA_URL = (process.env.NEXT_PUBLIC_MEDUSA_URL || "https://legion.sentinelprime.org").replace(/\/$/, "");
const MEDUSA_PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || "";
const MEDUSA_ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "";
const MEDUSA_ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "";
const MEDUSA_KEY = process.env.MEDUSA_API_KEY || "";

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string> {
  if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt) {
    return cachedAdminToken.token;
  }

  if (MEDUSA_ADMIN_EMAIL && MEDUSA_ADMIN_PASSWORD) {
    const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: MEDUSA_ADMIN_EMAIL, password: MEDUSA_ADMIN_PASSWORD }),
    });
    if (res.ok) {
      const data = (await res.json()) as { token: string };
      cachedAdminToken = { token: data.token, expiresAt: Date.now() + 50 * 60 * 1000 };
      return data.token;
    }
  }

  if (MEDUSA_KEY) return MEDUSA_KEY;
  throw new Error("Medusa credentials not configured");
}

export async function medusaHeaders() {
  const token = await getAdminToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function medusaAdminFetch(path: string, options: RequestInit = {}) {
  const headers = await medusaHeaders();
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const msg = (data as { message?: string }).message || `Medusa error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function listProducts(limit = 100) {
  const data = await medusaAdminFetch(`/admin/products?limit=${limit}&fields=*variants,*variants.prices`);
  return (data as { products: MedusaProduct[] }).products ?? [];
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  return medusaAdminFetch(`/admin/products/${id}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(id: string) {
  return medusaAdminFetch(`/admin/products/${id}`, { method: "DELETE" });
}

export async function updateVariantPrice(variantId: string, amountCents: number) {
  return medusaAdminFetch(`/admin/products/variants/${variantId}`, {
    method: "POST",
    body: JSON.stringify({
      prices: [{ amount: amountCents, currency_code: "usd" }],
    }),
  });
}

export function storeHeaders() {
  return MEDUSA_PUBLISHABLE_KEY ? { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY } : {};
}

export type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  status: string;
  thumbnail?: string;
  variants?: {
    id: string;
    title: string;
    prices?: { amount: number; currency_code: string }[];
  }[];
};
