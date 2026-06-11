import { API_TOKEN_KEY } from "@/lib/config";

export function getApiToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(API_TOKEN_KEY) || "";
}

export function authHeaders(): HeadersInit {
  const token = getApiToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
