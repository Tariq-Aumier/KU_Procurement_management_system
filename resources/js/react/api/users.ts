// Users API using the existing api function from AppContext

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
  name: string;
  email: string | undefined;
  role: string;
  active: boolean;
  office_id: number | undefined;
  created_at: string;
  updated_at: string;
  deleted_at: string | undefined;
}

export interface UserResponse {
  data: User[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const usersApi = {
  list: async (params?: { q?: string }): Promise<User[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    
    const url = `/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<User> => {
    const response = await api(`/users/${id}`);
    return response;
  },

  create: async (user: Partial<User> & { password?: string }): Promise<User> => {
    const response = await api('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return response;
  },

  update: async (id: number, user: Partial<User> & { password?: string }): Promise<User> => {
    const response = await api(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<User> => {
    const response = await api(`/users/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
