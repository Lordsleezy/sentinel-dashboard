import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export type ScoutApproval = {
  id: string;
  title: string;
  price: number | null;
  market_value: number | null;
  source: string | null;
  url: string | null;
  image: string | null;
  condition: string | null;
  score: number | null;
  reasoning: string | null;
  status: string;
  created_at: string;
};

export type ListerDraft = {
  id: string;
  input: string;
  source_url: string | null;
  title: string | null;
  description: string | null;
  features: string[] | null;
  images: string[] | null;
  price: number | null;
  retailer: string | null;
  raw_extract: Record<string, unknown> | null;
  generated_listing: Record<string, unknown> | null;
  status: string;
  medusa_product_id: string | null;
  created_at: string;
};
