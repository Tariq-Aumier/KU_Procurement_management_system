// Offices API using the existing api function from AppContext

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

export interface Office {
  id: number;
  office_category_id: number;
  code: string;
  name: string;
  name_ps: string | undefined;
  name_fa: string | undefined;
  description: string | undefined;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | undefined;
}

export interface OfficeResponse {
  data: Office[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface OfficeSingleResponse {
  data: Office;
}

export const officesApi = {
  list: async (params?: { q?: string; office_category_id?: number }): Promise<Office[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.office_category_id) searchParams.append('office_category_id', params.office_category_id.toString());
    
    const url = `/offices${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<Office> => {
    const response = await api(`/offices/${id}`);
    return response;
  },

  create: async (office: Partial<Office>): Promise<Office> => {
    const response = await api('/offices', {
      method: 'POST',
      body: JSON.stringify(office),
    });
    return response;
  },

  update: async (id: number, office: Partial<Office>): Promise<Office> => {
    const response = await api(`/offices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(office),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/offices/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<Office> => {
    const response = await api(`/offices/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
