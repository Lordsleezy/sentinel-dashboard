const MEDUSA_URL = (process.env.NEXT_PUBLIC_MEDUSA_URL || "https://legion.sentinelprime.org").replace(/\/$/, "");
const MEDUSA_KEY = process.env.MEDUSA_API_KEY || "";

export function medusaHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${MEDUSA_KEY}`,
  };
}

export async function medusaAdminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...options,
    headers: { ...medusaHeaders(), ...(options.headers || {}) },
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
