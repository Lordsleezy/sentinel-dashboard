export function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.detail === "string") return obj.detail;
  if (Array.isArray(obj.detail)) {
    return obj.detail
      .map((d) => (typeof d === "object" && d && "msg" in d ? String((d as { msg: string }).msg) : String(d)))
      .join("; ");
  }
  return fallback;
}
