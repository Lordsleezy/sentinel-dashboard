import { NextResponse } from "next/server";

export const commandCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function commandOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: commandCorsHeaders });
}
