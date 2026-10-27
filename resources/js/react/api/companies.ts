// Companies API using the existing api function from AppContext

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

export interface Company {
  id: number;
  legal_name: string;
  company_type: string;
  registration_no: string;
  contact_person: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  experience: string | null;
  eligibility_status: string;
  blacklist_reason: string | null;
  blacklisted_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CompanyResponse {
  data: Company[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface CompanySingleResponse {
  data: Company;
}

export const companiesApi = {
  list: async (params?: { q?: string; eligibility_status?: string }): Promise<Company[]> => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.append('q', params.q);
    if (params?.eligibility_status) searchParams.append('eligibility_status', params.eligibility_status);
    
    const url = `/companies${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },

  get: async (id: number): Promise<Company> => {
    const response = await api(`/companies/${id}`);
    return response;
  },

  create: async (company: Partial<Company>): Promise<Company> => {
    const response = await api('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
    return response;
  },

  update: async (id: number, company: Partial<Company>): Promise<Company> => {
    const response = await api(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(company),
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await api(`/companies/${id}`, {
      method: 'DELETE',
    });
  },

  restore: async (id: number): Promise<Company> => {
    const response = await api(`/companies/${id}/restore`, {
      method: 'POST',
    });
    return response;
  },
};
