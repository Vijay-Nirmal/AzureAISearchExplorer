const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const tryParseJson = async <T>(response: Response): Promise<T> => {
  // Handle explicit no-content
  if (response.status === 204) return {} as T;

  // Some endpoints return 202/200 with no body.
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') return {} as T;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text();
    return (text ? (text as unknown as T) : ({} as T));
  }

  const text = await response.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
};

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return tryParseJson<T>(response);
  },
  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return tryParseJson<T>(response);
  },
  put: async <T>(endpoint: string, body: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return tryParseJson<T>(response);
  },
  delete: async (endpoint: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
  }
};
