// Office Categories API using the existing api function from AppContext

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

export interface OfficeCategory {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | undefined;
}

export interface OfficeCategoryResponse {
  data: OfficeCategory[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface OfficeCategorySingleResponse {
  data: OfficeCategory;
}

export const officeCategoriesApi = {
  list: async (params?: { q?: string }): Promise<OfficeCategory[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    
    const url = `/office-categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<OfficeCategory> => {
    const response = await api(`/office-categories/${id}`);
    return response;
  },

  create: async (category: Partial<OfficeCategory>): Promise<OfficeCategory> => {
    const response = await api('/office-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return response;
  },

  update: async (id: number, category: Partial<OfficeCategory>): Promise<OfficeCategory> => {
    const response = await api(`/office-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(category),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/office-categories/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<OfficeCategory> => {
    const response = await api(`/office-categories/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
