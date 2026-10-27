// Reports API using the existing api function from AppContext

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

export interface ReportExportJob {
  exportJobId: number;
  downloadUrl: string;
}

export const reportsApi = {
  // Get report data for dashboard (uses existing APIs)
  getDashboardData: async () => {
    // Import the other APIs dynamically to avoid circular dependencies
    const { contractsApi } = await import("./contracts");
    const { ordersApi } = await import("./orders");
    const { companiesApi } = await import("./companies");
    
    const [contracts, orders, companies] = await Promise.all([
      contractsApi.list(),
      ordersApi.list(),
      companiesApi.list(),
    ]);
    
    return { contracts, orders, companies };
  },

  // Export report as CSV
  exportReport: async (code: "contracts" | "orders" | "companies" | "inventory", params?: Record<string, string>): Promise<ReportExportJob> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    
    const response = await api(`/reports/${code}?format=csv${searchParams.toString() ? `&${searchParams.toString()}` : ''}`, {
      method: 'GET',
    });
    return response;
  },

  // Download exported file
  downloadExport: async (exportJobId: number): Promise<Blob> => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_URL}/exports/${exportJobId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return response.blob();
  },
};
