// Backups API using the existing api function from AppContext

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

export interface Backup {
  id: number;
  storage_path: string;
  checksum: string;
  status: string;
  created_by: number;
  retention_until: string;
  created_at: string;
  updated_at: string;
}

export interface BackupResponse {
  data: Backup[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const backupsApi = {
  list: async (): Promise<Backup[]> => {
    const response = await api('/backups');
    return Array.isArray(response) ? response : response?.data || [];
  },

  create: async (): Promise<Backup> => {
    const response = await api('/backups', {
      method: 'POST',
    });
    return response;
  },

  downloadJson: async (id: number): Promise<Blob> => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_URL}/backups/${id}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return response.blob();
  },

  downloadExcel: async (id: number): Promise<Blob> => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API_URL}/backups/${id}/download-excel`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    
    return response.blob();
  },

  delete: async (id: number): Promise<void> => {
    await api(`/backups/${id}`, {
      method: 'DELETE',
    });
  },
};
