import { NextResponse } from "next/server";
import { LEGION_SERVICES } from "@/lib/config";

export async function GET() {
  const results = await Promise.all(
    LEGION_SERVICES.map(async (svc) => {
      const url = svc.publicUrl;
      const start = Date.now();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        return { name: svc.name, ok: res.ok, ms: Date.now() - start, url };
      } catch {
        return { name: svc.name, ok: false, ms: Date.now() - start, url };
      }
    })
  );
  return NextResponse.json({ services: results });
}
