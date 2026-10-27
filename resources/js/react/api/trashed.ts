// Trashed items API using the existing api function from AppContext

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

export interface TrashedItem {
  id: number;
  deleted_at: string;
  [key: string]: any;
}

export const trashedApi = {
  list: async (resource: string): Promise<TrashedItem[]> => {
    const response = await api(`/${resource}/trashed`);
    return Array.isArray(response) ? response : response?.data || [];
  },

  restore: async (resource: string, id: number): Promise<void> => {
    await api(`/${resource}/${id}/restore`, {
      method: 'POST',
    });
  },

  forceDelete: async (resource: string, id: number): Promise<void> => {
    await api(`/${resource}/${id}/force`, {
      method: 'DELETE',
    });
  },

  // Special handling for procurement forms that have custom endpoints
  restoreProcurementForm: async (formType: string, id: number): Promise<void> => {
    await api(`/procurement-forms/${formType}/${id}/restore`, {
      method: 'POST',
    });
  },

  forceDeleteProcurementForm: async (formType: string, id: number): Promise<void> => {
    await api(`/procurement-forms/${formType}/${id}/force`, {
      method: 'DELETE',
    });
  },

  listProcurementForm: async (formType: string): Promise<TrashedItem[]> => {
    const response = await api(`/procurement-forms/${formType}`);
    const allItems = Array.isArray(response) ? response : response?.data || [];
    // Filter only trashed items
    return allItems.filter((item: any) => item.deleted_at !== null);
  },
};
