const TOKEN_KEY = "cosaku_admin_token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(path: string) {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (!base && import.meta.env.PROD) {
    throw new Error("API is not configured. Set VITE_API_URL to the Render backend URL.");
  }
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

type Options = RequestInit & { json?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Token ${token}`);
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Could not reach the COSAKU API.");
  }

  const data = await response.json();
  if (!response.ok) {
    const detail =
      data.detail ||
      Object.values(data)
        .flat()
        .join(" ") ||
      "Request failed.";
    throw new Error(typeof detail === "string" ? detail : "Request failed.");
  }
  return data as T;
}
