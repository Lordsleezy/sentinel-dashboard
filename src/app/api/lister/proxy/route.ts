import { NextRequest, NextResponse } from "next/server";
import { LISTER_API } from "@/lib/config";
import { formatApiError } from "@/lib/api-error";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, id, payload } = body as { action: string; id?: string; payload?: object };

  let url = LISTER_API;
  if (action === "list") url += "/list";
  else if (action === "approve" && id) url += `/approve/${id}`;
  else if (action === "reject" && id) url += `/reject/${id}`;
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // /list can take 60–120s (Ollama + crawl). Prefer direct browser calls for list.
  const timeoutMs = action === "list" ? 120_000 : 30_000;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: formatApiError(data, `Lister returned ${res.status}`), ...data },
        { status: res.status }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lister request failed";
    const isTimeout = message.includes("abort") || message.includes("timeout");
    return NextResponse.json(
      {
        error: isTimeout
          ? "Lister timed out — listing can take up to 2 minutes. Try again or use the Lister page."
          : message,
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
