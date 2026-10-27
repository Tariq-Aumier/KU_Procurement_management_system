// Audit Logs API using the existing api function from AppContext

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

export interface AuditLog {
  id: number;
  actor_user_id: number;
  username: string;
  action: string;
  entity_type: string;
  entity_id: number | undefined;
  details_json: string;
  created_at: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const auditLogsApi = {
  list: async (params?: { actor_user_id?: number; entity_type?: string; action?: string; pageSize?: number }): Promise<AuditLog[]> => {
    const searchParams = new URLSearchParams();
    if (params?.actor_user_id) searchParams.append('actor_user_id', params.actor_user_id.toString());
    if (params?.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params?.action) searchParams.append('action', params.action);
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    
    const url = `/audit-logs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await api(url);
    return Array.isArray(response) ? response : response?.data || [];
  },
};
