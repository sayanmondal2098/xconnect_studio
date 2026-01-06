const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export function getToken(): string | null {
  return localStorage.getItem("xconnect_token");
}
export function setToken(token: string) {
  localStorage.setItem("xconnect_token", token);
}
export function clearToken() {
  localStorage.removeItem("xconnect_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(init.headers as any) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  const raw = await res.text();
  const data = raw ? safeJson(raw) : null;

  if (!res.ok) {
    const msg =
      (data && (data.detail?.[0]?.msg || data.detail || data.message || data.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return (data ?? ({} as any)) as T;
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export type TokenResponse = { access_token: string; token_type: string; expires_in_seconds: number };
export type MeResponse = { id: number; email: string; created_at: string };

export type IntegrationSummary = {
  id: number;
  provider: string;
  label: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
};

export const api = {
  // Auth
  register: (email: string, password: string) =>
    request<TokenResponse>(`/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<MeResponse>(`/api/auth/me`),

  updateMe: (patch: { email?: string | null }) =>
    request<MeResponse>(`/api/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),

  changePassword: (current_password: string, new_password: string) =>
    request<{ ok: boolean }>(`/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password, new_password }),
    }),

  // Settings
  getUserSettings: () => request<{ ok: boolean; settings: { theme: string; notifications: boolean } }>(`/api/user/settings`),

  putUserSettings: (patch: { theme?: string | null; notifications?: boolean | null }) =>
    request<{ ok: boolean; settings: { theme: string; notifications: boolean } }>(`/api/user/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),

  // Integrations
  listIntegrations: () => request<{ ok: boolean; items: IntegrationSummary[] }>(`/api/integrations`),

  deleteIntegration: (provider: string, label: string) =>
    request<{ ok: boolean }>(`/api/integrations/${encodeURIComponent(provider)}/${encodeURIComponent(label)}`, {
      method: "DELETE",
    }),

  connectGithub: (payload: { token: string; label?: string }) =>
    request<{ ok: boolean; label: string; github_login: string; github_user_id: number }>(`/api/integrations/github`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  connectServiceNow: (payload: { instance_url: string; username: string; password: string; label?: string }) =>
    request<{ ok: boolean; label: string; instance_url: string; user: string }>(`/api/integrations/servicenow`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // “Test” endpoints by exercising the integration
  listGithubRepos: (label = "default") =>
    request<{ ok: boolean; repos: { id: number; full_name: string; private: boolean; html_url: string }[] }>(
      `/api/github/repos?label=${encodeURIComponent(label)}`
    ),

  listServiceNowTables: (label = "default", limit = 50, query?: string) => {
    const qs = new URLSearchParams();
    qs.set("label", label);
    qs.set("limit", String(limit));
    if (query) qs.set("query", query);
    return request<{ ok: boolean; tables: { name: string; label?: string | null }[]; returned: number }>(`/api/servicenow/tables?${qs}`);
  },

  // Mappings (lightly used right now)
  listMappings: () => request<{ ok: boolean; items: any[] }>(`/api/mappings`),
  createMapping: (payload: { github_repo_full_name: string; servicenow_table: string; label?: string }) =>
    request<any>(`/api/mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};
