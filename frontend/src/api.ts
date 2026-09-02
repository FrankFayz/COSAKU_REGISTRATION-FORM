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
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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
    if (!response.ok) throw new Error("Request failed.");
    return (await response.blob()) as T;
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
