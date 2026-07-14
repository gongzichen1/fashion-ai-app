import type { Analysis, Preferences, User, WardrobeItem } from "./types";

export class ApiError extends Error {
  status: number;
  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw new ApiError("网络连接失败，请检查网络后重试", 0);
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || payload?.error?.message || `请求失败（${response.status}）`, response.status, payload?.requestId || requestId);
  }
  return (payload?.data ?? payload) as T;
}

function listOf<T>(payload: T[] | { items?: T[]; results?: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.results ?? [];
}

export const api = {
  me: () => request<User>("/me"),
  feishuChallenge: () => request<{ state: string; expiresIn: number }>("/auth/feishu/challenge", { method: "POST" }),
  loginWithFeishu: (code: string, state: string) => request<User>("/auth/feishu/login", { method: "POST", body: JSON.stringify({ code, state }) }),
  devLogin: () => request<User>("/auth/dev-login", { method: "POST", body: JSON.stringify({ name: "本地体验用户" }) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  jsapiConfig: (url: string) => request<Record<string, unknown>>(`/auth/feishu/jsapi-config?url=${encodeURIComponent(url)}`),
  history: async () => listOf(await request<Analysis[] | { items?: Analysis[]; results?: Analysis[] }>("/history?page=1&per_page=50")),
  result: (id: string) => request<Analysis>(`/result/${encodeURIComponent(id)}`),
  analyze: (file: File, preferences: Preferences) => {
    const body = new FormData();
    body.append("image", file);
    body.append("style_preference", JSON.stringify(preferences));
    return request<Analysis>("/analyze", { method: "POST", body });
  },
  favorites: async () => listOf(await request<Analysis[] | { items?: Analysis[] }>("/favorites?page=1&per_page=50")),
  addFavorite: (analysisId: string) => request<unknown>("/favorites", { method: "POST", body: JSON.stringify({ analysis_id: analysisId }) }),
  removeFavorite: (analysisId: string) => request<void>(`/favorites/${encodeURIComponent(analysisId)}`, { method: "DELETE" }),
  wardrobe: async () => listOf(await request<WardrobeItem[] | { items?: WardrobeItem[] }>("/wardrobe?page=1&per_page=50")),
  addWardrobe: (analysisId: string) => request<WardrobeItem>("/wardrobe", { method: "POST", body: JSON.stringify({ analysis_id: analysisId }) }),
  removeWardrobe: (id: string) => request<void>(`/wardrobe/${encodeURIComponent(id)}`, { method: "DELETE" }),
  preferences: () => request<Preferences>("/preferences"),
  savePreferences: (preferences: Preferences) => request<Preferences>("/preferences", { method: "PUT", body: JSON.stringify(preferences) }),
};

export function assetUrl(path?: string): string {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}
