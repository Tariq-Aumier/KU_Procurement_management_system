// Auth API using the existing api function from AppContext

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

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string | undefined;
  role: string;
  officeId: number | undefined;
  active: boolean;
  lastLoginAt: string | undefined;
}

export const authApi = {
  me: async (): Promise<User> => {
    const response = await api('/me');
    return response;
  },

  updateProfile: async (data: { name: string; email?: string }): Promise<User> => {
    const response = await api('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string; newPassword_confirmation?: string }): Promise<void> => {
    await api('/me/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
