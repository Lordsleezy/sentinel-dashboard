import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const supabase = getSupabase();
    const { data: clicks, error } = await supabase
      .from("download_clicks")
      .select("id, product, page, referrer, ip_address, city, country, clicked_at")
      .order("clicked_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clicks: clicks || [] }),
    };
  } catch (err) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: err.message || "Downloads data not available" }),
    };
  }
}
