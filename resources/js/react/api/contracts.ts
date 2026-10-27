// Contracts API using the existing api function from AppContext

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

export interface Contract {
  id: number;
  contract_no: string;
  award_id: number | undefined;
  company_id: number;
  title: string;
  amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  progress_percent: number;
  description: string | undefined;
  created_at: string;
  updated_at: string;
  deleted_at: string | undefined;
}

export interface ContractResponse {
  data: Contract[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface ContractSingleResponse {
  data: Contract;
}

export const contractsApi = {
  list: async (params?: { q?: string; status?: string }): Promise<Contract[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.status) searchParams.append('status', params.status);
    
    const url = `/contracts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<Contract> => {
    const response = await api(`/contracts/${id}`);
    return response;
  },

  create: async (contract: Partial<Contract>): Promise<Contract> => {
    const response = await api('/contracts', {
      method: 'POST',
      body: JSON.stringify(contract),
    });
    return response;
  },

  update: async (id: number, contract: Partial<Contract>): Promise<Contract> => {
    const response = await api(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(contract),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/contracts/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<Contract> => {
    const response = await api(`/contracts/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
