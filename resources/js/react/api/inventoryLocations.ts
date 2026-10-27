// Inventory Locations API using the existing api function from AppContext

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

export interface InventoryLocation {
  id: number;
  office_id: number | undefined;
  code: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | undefined;
}

export interface InventoryLocationResponse {
  data: InventoryLocation[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const inventoryLocationsApi = {
  list: async (params?: { q?: string }): Promise<InventoryLocation[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    
    const url = `/inventory-locations${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<InventoryLocation> => {
    const response = await api(`/inventory-locations/${id}`);
    return response;
  },

  create: async (location: Partial<InventoryLocation>): Promise<InventoryLocation> => {
    const response = await api('/inventory-locations', {
      method: 'POST',
      body: JSON.stringify(location),
    });
    return response;
  },

  update: async (id: number, location: Partial<InventoryLocation>): Promise<InventoryLocation> => {
    const response = await api(`/inventory-locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(location),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/inventory-locations/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<InventoryLocation> => {
    const response = await api(`/inventory-locations/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
