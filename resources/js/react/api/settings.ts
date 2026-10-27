// Settings API using the existing api function from AppContext

const API_URL = "/api/v1";
const TOKEN_KEY = "pms_access_token";

const api = async (path: string, init: RequestInit = {}): Promise<any> => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = { 
    Accept: "application/json",
    ...(init.headers as Record<string, string> || {}) 
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body && !(init.body instanceof FormData)) headers["Content-Type"] = "application/json";
  
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message || `API request failed: ${res.status}`);
  }
  return body.data;
};

export interface SystemSetting {
  setting_key: string;
  value_json: string;
  is_secret: boolean;
  updated_at: string;
}

export const settingsApi = {
  list: async (): Promise<SystemSetting[]> => {
    const response = await api('/settings');
    return Array.isArray(response) ? response : response?.data || [];
  },

  update: async (key: string, value: any): Promise<SystemSetting> => {
    const response = await api(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    return response;
  },
};
