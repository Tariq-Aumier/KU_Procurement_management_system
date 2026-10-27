// Inventory Items API using the existing api function from AppContext

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

export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  item_type: string;
  category: string;
  description: string | undefined;
  unit: string;
  min_stock: number;
  max_stock: number | undefined;
  reorder_point: number;
  inventory_location_id: number;
  supplier_company_id: number | undefined;
  batch_number: string | undefined;
  serial_number: string | undefined;
  received_date: string | undefined;
  expiry_date: string | undefined;
  condition: string;
  notes: string | undefined;
  unit_cost: number | undefined;
  currency: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | undefined;
}

export interface InventoryItemResponse {
  data: InventoryItem[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const inventoryItemsApi = {
  list: async (params?: { q?: string; item_type?: string }): Promise<InventoryItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.item_type) searchParams.append('item_type', params.item_type);
    
    const url = `/inventory-items${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<InventoryItem> => {
    const response = await api(`/inventory-items/${id}`);
    return response;
  },

  create: async (item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api('/inventory-items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return response;
  },

  update: async (id: number, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api(`/inventory-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(item),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/inventory-items/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<InventoryItem> => {
    const response = await api(`/inventory-items/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
