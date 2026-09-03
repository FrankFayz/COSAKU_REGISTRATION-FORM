const TOKEN_KEY = "cosaku_admin_token";
const LIVE_API = "https://cosaku-registration-form.onrender.com";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(path: string, base = apiBase()) {
  const prefix = base.replace(/\/$/, "");
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

function apiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return import.meta.env.PROD ? LIVE_API : "";
}

function shouldFallback(response: Response | null, failed: boolean) {
  if (import.meta.env.PROD || apiBase()) return false;
  if (failed) return true;
  if (!response) return true;
  if (response.status === 502 || response.status === 503 || response.status === 504) return true;
  const type = response.headers.get("content-type") || "";
  return response.status >= 500 && !type.includes("application/json");
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

  const { json, ...requestInit } = options;
  const init: RequestInit = {
    ...requestInit,
    headers,
    body: json !== undefined ? JSON.stringify(json) : options.body,
  };

  let response: Response | null = null;
  let failed = false;
  try {
    response = await fetch(apiUrl(path), init);
  } catch {
    failed = true;
  }

  if (shouldFallback(response, failed)) {
    try {
      response = await fetch(apiUrl(path, LIVE_API), init);
      failed = false;
    } catch {
      failed = true;
    }
  }

  if (failed || !response) {
    throw new Error("Could not reach the COSAKU API.");
  }

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
