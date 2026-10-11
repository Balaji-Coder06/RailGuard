import type {
  HealthStatus,
  ModelInfo,
  ModelMetrics,
  StatsResponse,
  Inspection,
  InspectionListResponse,
} from '../types';

// Read API Base URL from Vite env or local storage override, default to relative ''
export function getApiBaseUrl(): string {
  const custom = localStorage.getItem('railguard_api_base_url');
  if (custom !== null && custom.trim() !== '') {
    return custom.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setCustomApiBaseUrl(url: string): void {
  if (!url || url.trim() === '') {
    localStorage.removeItem('railguard_api_base_url');
  } else {
    localStorage.setItem('railguard_api_base_url', url.trim());
  }
}

export function buildImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMsg = `Server error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use fallback error message
      }
      throw new Error(errorMsg);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown network or server error occurred.');
  }
}

export const api = {
  // Health
  getHealth: (): Promise<HealthStatus> => request<HealthStatus>('/api/health'),

  // Model Info
  getModelInfo: (): Promise<ModelInfo> => request<ModelInfo>('/api/model/info'),

  // Metrics
  getMetrics: (): Promise<ModelMetrics> => request<ModelMetrics>('/api/metrics'),

  // Dashboard Stats
  getStats: (): Promise<StatsResponse> => request<StatsResponse>('/api/inspections/stats'),

  // List Inspections
  listInspections: (params: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
    sort_by?: string;
  } = {}): Promise<InspectionListResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);

    const query = searchParams.toString();
    return request<InspectionListResponse>(`/api/inspections${query ? `?${query}` : ''}`);
  },

  // Inspection Detail
  getInspection: (id: string): Promise<Inspection> => request<Inspection>(`/api/inspections/${id}`),

  // Delete Inspection
  deleteInspection: (id: string): Promise<{ message: string; id: string }> =>
    request<{ message: string; id: string }>(`/api/inspections/${id}`, {
      method: 'DELETE',
    }),

  // Run Inference / Detect
  detect: async (file: File | Blob, filename: string, confidence: number = 0.25): Promise<Inspection> => {
    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('confidence', confidence.toString());

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/detect`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = `Inference failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // fallback
      }
      throw new Error(errorMsg);
    }

    return (await response.json()) as Inspection;
  },
};
