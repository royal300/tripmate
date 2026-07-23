const API_BASE = import.meta.env.VITE_API_URL || 'https://tripmate.royal300.com/api';

function getToken(): string | null {
  return localStorage.getItem('tripmate_admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('tripmate_admin_token');
    window.location.href = '/admin/';
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Dashboard
  getDashboard: () => request<any>('/admin/dashboard'),

  // Leads
  getLeads: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ leads: any[]; total: number }>(`/admin/leads${q}`);
  },
  getLead: (id: string) => request<any>(`/admin/leads/${id}`),
  updateLead: (id: string, data: any) =>
    request<any>(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Packages
  getPackages: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/admin/packages${q}`);
  },
  getPackage: (id: string) => request<any>(`/admin/packages/${id}`),
  createPackage: (data: any) =>
    request<any>('/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
  updatePackage: (id: string, data: any) =>
    request<any>(`/admin/packages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePackage: (id: string) =>
    request<any>(`/admin/packages/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<Record<string, string>>('/admin/settings'),
  updateSettings: (data: Record<string, string>) =>
    request<any>('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  getScoringRules: () => request<any[]>('/admin/settings/scoring-rules'),
  updateScoringRule: (id: number, data: any) =>
    request<any>(`/admin/settings/scoring-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
