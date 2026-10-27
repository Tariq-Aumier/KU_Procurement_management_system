// Procurement Orders API using the existing api function from AppContext

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

export interface ProcurementOrder {
  id: number;
  order_no: string;
  title: string;
  office_id: number | null;
  company_id: number | null;
  category: string;
  priority: string;
  status: string;
  requested_date: string;
  required_date: string;
  amount: number;
  equipment: number;
  items: number;
  currency: string;
  description: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items_list?: Array<{ id: number; name: string; quantity: number; unitPrice: number }>;
}

export interface OrderResponse {
  data: ProcurementOrder[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface OrderSingleResponse {
  data: ProcurementOrder;
}

export const ordersApi = {
  list: async (params?: { q?: string; status?: string; priority?: string; category?: string }): Promise<ProcurementOrder[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.category) searchParams.append('category', params.category);
    
    const url = `/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<ProcurementOrder> => {
    const response = await api(`/orders/${id}`);
    return response;
  },

  create: async (order: Partial<ProcurementOrder>): Promise<ProcurementOrder> => {
    const response = await api('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    return response;
  },

  update: async (id: number, order: Partial<ProcurementOrder>): Promise<ProcurementOrder> => {
    const response = await api(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(order),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/orders/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<ProcurementOrder> => {
    const response = await api(`/orders/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
