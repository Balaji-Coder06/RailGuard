// Read API Base URL from Vite env or local storage override, default to relative ''
export function getApiBaseUrl() {
  const custom = localStorage.getItem('railguard_api_base_url');
  if (custom !== null && custom.trim() !== '') {
    return custom.trim().replace(/\/+$/, '');
  }
  // VITE_API_URL was used by the first frontend version. Keep it as a
  // fallback so existing deployments do not silently call the frontend host
  // and surface a gateway/model error instead of reaching FastAPI.
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setCustomApiBaseUrl(url) {
  if (!url || url.trim() === '') {
    localStorage.removeItem('railguard_api_base_url');
  } else {
    localStorage.setItem('railguard_api_base_url', url.trim());
  }
}

export function buildImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

async function fetchWithRetry(url, options = {}) {
  const transientStatuses = new Set([502, 503, 504]);
  const retryDelays = [250, 750];
  const method = (options.method || 'GET').toUpperCase();
  const retryable = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, options);
    if (!retryable || !transientStatuses.has(response.status) || attempt >= retryDelays.length) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
  }
}

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const response = await fetchWithRetry(url, {
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

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown network or server error occurred.');
  }
}

export const api = {
  // Health
  getHealth: () => request('/api/health'),

  // Model Info
  getModelInfo: () => request('/api/model/info'),

  // Metrics
  getMetrics: () => request('/api/metrics'),

  // Dashboard Stats
  getStats: () => request('/api/inspections/stats'),

  // List Inspections
  listInspections: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);

    const query = searchParams.toString();
    return request(`/api/inspections${query ? `?${query}` : ''}`);
  },

  // Inspection Detail
  getInspection: (id) => request(`/api/inspections/${id}`),

  // Delete Inspection
  deleteInspection: (id) =>
    request(`/api/inspections/${id}`, {
      method: 'DELETE',
    }),

  // Run Inference / Detect
  detect: async (file, filename, confidence = 0.25) => {
    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('confidence', confidence.toString());

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/detect`;

    const response = await fetchWithRetry(url, {
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

    return await response.json();
  },
};
