import { INVEST_API } from "@/lib/config";

export async function fetchInvestApi<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${INVEST_API}${path}`, {
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
    if (res.ok) return (await res.json()) as T;
  } catch {
    // backend not live — use mock
  }
  return fallback;
}
