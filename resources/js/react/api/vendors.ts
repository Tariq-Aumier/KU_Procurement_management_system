// Vendors API using the existing api function from AppContext

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

export interface Vendor {
  id: number;
  company_id: number;
  account_no: string;
  tax_id: string | null;
  bank_name: string | null;
  bank_account: string | null;
  contact_info: string | null;
  verification_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface VendorResponse {
  data: Vendor[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const vendorsApi = {
  list: async (params?: { q?: string; verification_status?: string }): Promise<Vendor[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.verification_status) searchParams.append('verification_status', params.verification_status);
    
    const url = `/vendors${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<Vendor> => {
    const response = await api(`/vendors/${id}`);
    return response;
  },

  create: async (vendor: Partial<Vendor>): Promise<Vendor> => {
    const response = await api('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
    return response;
  },

  update: async (id: number, vendor: Partial<Vendor>): Promise<Vendor> => {
    const response = await api(`/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(vendor),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/vendors/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<Vendor> => {
    const response = await api(`/vendors/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
