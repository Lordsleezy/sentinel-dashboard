import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_CHUNK_SIZE = 100;

type SendNotificationBody = {
  title?: unknown;
  body?: unknown;
  data?: unknown;
};

type ExpoPushTicket = {
  status?: string;
  message?: string;
  details?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  let body: SendNotificationBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  const data =
    body.data && typeof body.data === "object" && !Array.isArray(body.data)
      ? (body.data as Record<string, unknown>)
      : {};

  if (!title || !message) {
    return NextResponse.json(
      { error: "title and body are required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { data: rows, error } = await supabase
    .from("push_devices")
    .select("token")
    .not("token", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tokens = Array.from(
    new Set(
      (rows ?? [])
        .map((row) => (typeof row.token === "string" ? row.token.trim() : ""))
        .filter(Boolean)
    )
  );

  if (!tokens.length) {
    return NextResponse.json({ sent: 0, failed: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (let index = 0; index < tokens.length; index += EXPO_CHUNK_SIZE) {
    const chunk = tokens.slice(index, index + EXPO_CHUNK_SIZE);
    const messages = chunk.map((token) => ({
      to: token,
      title,
      body: message,
      data,
      sound: "default",
    }));

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(15000),
      });

      const payload = await response.json().catch(() => ({}));
      const tickets = Array.isArray(payload.data)
        ? (payload.data as ExpoPushTicket[])
        : [];

      if (!response.ok || tickets.length === 0) {
        failed += chunk.length;
        continue;
      }

      tickets.forEach((ticket) => {
        if (ticket.status === "ok") sent += 1;
        else failed += 1;
      });

      if (tickets.length < chunk.length) {
        failed += chunk.length - tickets.length;
      }
    } catch {
      failed += chunk.length;
    }
  }

  return NextResponse.json({ sent, failed });
}
